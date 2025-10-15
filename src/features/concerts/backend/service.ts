// src/features/concerts/backend/service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  ConcertTableRowSchema,
  ConcertResponseSchema,
  type ConcertResponse,
  ConcertDetailResponseSchema,
  type ConcertDetailResponse,
  type SeatGradeInfo,
} from '@/features/concerts/backend/schema';
import {
  concertErrorCodes,
  type ConcertServiceError,
} from '@/features/concerts/backend/error';

const CONCERTS_TABLE = 'concerts';
const SEATS_TABLE = 'seats';

const fallbackPosterImage = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}/400/600`;

export const getConcerts = async (
  client: SupabaseClient,
): Promise<HandlerResult<ConcertResponse[], ConcertServiceError, unknown>> => {
  console.log('📋 Fetching concerts from Supabase...');

  // 1. Supabase 쿼리: 콘서트 목록 + 좌석 집계
  const { data, error } = await client
    .from(CONCERTS_TABLE)
    .select(`
      id,
      title,
      artist,
      venue,
      date,
      poster_image,
      description,
      created_at,
      updated_at
    `)
    .gte('date', new Date().toISOString()) // 현재 시각 이후 콘서트만
    .order('date', { ascending: true }); // 날짜 오름차순 정렬

  if (error) {
    console.error('❌ Supabase error when fetching concerts:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return failure(500, concertErrorCodes.fetchError, error.message);
  }

  console.log('✅ Successfully fetched concerts:', data?.length || 0, 'concerts');

  if (!data || data.length === 0) {
    // 빈 목록도 성공으로 처리
    return success([]);
  }

  // 2. 각 콘서트별 좌석 집계
  const concertIds = data.map((c) => c.id);
  console.log('📋 Fetching seats for concert IDs:', concertIds);

  const { data: seatsData, error: seatsError } = await client
    .from(SEATS_TABLE)
    .select('concert_id, status')
    .in('concert_id', concertIds);

  if (seatsError) {
    console.error('❌ Supabase error when fetching seats:', {
      message: seatsError.message,
      details: seatsError.details,
      hint: seatsError.hint,
      code: seatsError.code
    });
    return failure(500, concertErrorCodes.fetchError, seatsError.message);
  }

  console.log('✅ Successfully fetched seats:', seatsData?.length || 0, 'seats');

  // 3. 좌석 수 집계 (Map 사용)
  const seatCounts = new Map<string, { total: number; available: number }>();

  seatsData?.forEach((seat) => {
    const counts = seatCounts.get(seat.concert_id) || { total: 0, available: 0 };
    counts.total += 1;
    if (seat.status === 'available') {
      counts.available += 1;
    }
    seatCounts.set(seat.concert_id, counts);
  });

  // 4. 응답 데이터 변환 및 검증
  const concerts: ConcertResponse[] = [];

  for (const concert of data) {
    const counts = seatCounts.get(concert.id) || { total: 0, available: 0 };

    // 날짜를 ISO 8601 형식으로 변환
    const formatDate = (dateStr: any): string => {
      if (!dateStr) return new Date().toISOString();
      const date = new Date(dateStr);
      return date.toISOString();
    };

    // Row 검증
    const rowWithCounts = {
      ...concert,
      date: formatDate(concert.date),
      created_at: formatDate(concert.created_at),
      updated_at: formatDate(concert.updated_at),
      total_seats: counts.total,
      available_seats: counts.available,
    };

    console.log('🔍 Processing concert:', {
      id: concert.id,
      title: concert.title,
      original_date: concert.date,
      formatted_date: rowWithCounts.date,
    });

    const rowParse = ConcertTableRowSchema.safeParse(rowWithCounts);

    if (!rowParse.success) {
      console.error('❌ Validation failed for concert:', concert.id, rowParse.error.format());
      return failure(
        500,
        concertErrorCodes.validationError,
        'Concert row failed validation.',
        rowParse.error.format(),
      );
    }

    // snake_case → camelCase 변환
    const mapped: ConcertResponse = {
      id: rowParse.data.id,
      title: rowParse.data.title,
      artist: rowParse.data.artist,
      venue: rowParse.data.venue,
      date: rowParse.data.date,
      posterImage: rowParse.data.poster_image ?? fallbackPosterImage(rowParse.data.id),
      description: rowParse.data.description,
      totalSeats: rowParse.data.total_seats,
      availableSeats: rowParse.data.available_seats,
    };

    // Response 검증
    const parsed = ConcertResponseSchema.safeParse(mapped);

    if (!parsed.success) {
      return failure(
        500,
        concertErrorCodes.validationError,
        'Concert response failed validation.',
        parsed.error.format(),
      );
    }

    concerts.push(parsed.data);
  }

  return success(concerts);
};

export const getConcertById = async (
  client: SupabaseClient,
  concertId: string,
): Promise<HandlerResult<ConcertDetailResponse, ConcertServiceError, unknown>> => {
  // 1. UUID 형식 검증
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(concertId)) {
    return failure(400, concertErrorCodes.notFound, '잘못된 콘서트 ID 형식입니다');
  }

  // 2. 콘서트 기본 정보 조회
  const { data: concert, error: concertError } = await client
    .from(CONCERTS_TABLE)
    .select('*')
    .eq('id', concertId)
    .single();

  if (concertError || !concert) {
    return failure(404, concertErrorCodes.notFound, '콘서트를 찾을 수 없습니다');
  }

  // 3. 등급별 좌석 집계
  const { data: seatsData, error: seatsError } = await client
    .from(SEATS_TABLE)
    .select('grade, price, status')
    .eq('concert_id', concertId);

  if (seatsError) {
    return failure(500, concertErrorCodes.fetchError, seatsError.message);
  }

  // 4. 등급별 집계 계산
  const gradeMap = new Map<string, { price: number; total: number; available: number }>();

  seatsData?.forEach((seat) => {
    const existing = gradeMap.get(seat.grade) || { price: seat.price, total: 0, available: 0 };
    existing.total += 1;
    if (seat.status === 'available') {
      existing.available += 1;
    }
    gradeMap.set(seat.grade, existing);
  });

  // 5. 등급 순서 정렬 및 응답 데이터 생성
  const gradeOrder = ['Special', 'Premium', 'Advanced', 'Regular'];
  const grades: SeatGradeInfo[] = gradeOrder
    .filter((grade) => gradeMap.has(grade))
    .map((grade) => {
      const info = gradeMap.get(grade)!;
      return {
        grade: grade as 'Special' | 'Premium' | 'Advanced' | 'Regular',
        price: info.price,
        totalSeats: info.total,
        availableSeats: info.available,
        availabilityRate: info.total > 0 ? Math.round((info.available / info.total) * 10000) / 100 : 0,
      };
    });

  // 6. 전체 좌석 집계
  const totalSeats = grades.reduce((sum, g) => sum + g.totalSeats, 0);
  const totalAvailableSeats = grades.reduce((sum, g) => sum + g.availableSeats, 0);

  // 7. 응답 데이터 구성
  const response: ConcertDetailResponse = {
    id: concert.id,
    title: concert.title,
    artist: concert.artist,
    venue: concert.venue,
    date: new Date(concert.date).toISOString(),
    posterImage: concert.poster_image ?? fallbackPosterImage(concert.id),
    description: concert.description,
    grades,
    totalSeats,
    totalAvailableSeats,
  };

  // 8. 응답 검증
  const parsed = ConcertDetailResponseSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      concertErrorCodes.validationError,
      'Concert detail response failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};
