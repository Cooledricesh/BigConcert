// src/features/seats/backend/service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  SeatTableRowSchema,
  SeatResponseSchema,
  type SeatResponse,
  type CheckAvailabilityRequest,
  type CheckAvailabilityResponse,
} from './schema';
import {
  seatErrorCodes,
  type SeatServiceError,
} from './error';

const SEATS_TABLE = 'seats';
const CONCERTS_TABLE = 'concerts';

// 1. 콘서트별 좌석 목록 조회
export const getSeatsByConcertId = async (
  client: SupabaseClient,
  concertId: string,
): Promise<HandlerResult<SeatResponse[], SeatServiceError, unknown>> => {
  // UUID 형식 검증
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(concertId)) {
    return failure(400, seatErrorCodes.invalidConcert, '잘못된 콘서트 ID 형식입니다');
  }

  // 콘서트 존재 여부 확인
  const { data: concert, error: concertError } = await client
    .from(CONCERTS_TABLE)
    .select('id')
    .eq('id', concertId)
    .single();

  if (concertError || !concert) {
    return failure(404, seatErrorCodes.invalidConcert, '콘서트를 찾을 수 없습니다');
  }

  // 좌석 목록 조회 (구역, 열, 번호 순 정렬)
  const { data, error } = await client
    .from(SEATS_TABLE)
    .select('*')
    .eq('concert_id', concertId)
    .order('section', { ascending: true })
    .order('row', { ascending: true })
    .order('number', { ascending: true });

  if (error) {
    return failure(500, seatErrorCodes.fetchError, error.message);
  }

  if (!data || data.length === 0) {
    return failure(404, seatErrorCodes.notFound, '좌석 정보를 찾을 수 없습니다');
  }

  // 응답 데이터 변환 및 검증
  const seats: SeatResponse[] = [];

  for (const seat of data) {
    // Row 검증
    const rowParse = SeatTableRowSchema.safeParse(seat);

    if (!rowParse.success) {
      return failure(
        500,
        seatErrorCodes.validationError,
        'Seat row failed validation.',
        rowParse.error.format(),
      );
    }

    // snake_case → camelCase 변환
    const mapped: SeatResponse = {
      id: rowParse.data.id,
      concertId: rowParse.data.concert_id,
      section: rowParse.data.section,
      row: rowParse.data.row,
      number: rowParse.data.number,
      grade: rowParse.data.grade,
      price: rowParse.data.price,
      status: rowParse.data.status,
    };

    // Response 검증
    const parsed = SeatResponseSchema.safeParse(mapped);

    if (!parsed.success) {
      return failure(
        500,
        seatErrorCodes.validationError,
        'Seat response failed validation.',
        parsed.error.format(),
      );
    }

    seats.push(parsed.data);
  }

  return success(seats);
};

// 2. 좌석 가용성 확인 (동시성 제어)
export const checkSeatAvailability = async (
  client: SupabaseClient,
  request: CheckAvailabilityRequest,
): Promise<HandlerResult<CheckAvailabilityResponse, SeatServiceError, unknown>> => {
  const { concertId, seatIds } = request;

  // 좌석 ID 최대 4개 제한
  if (seatIds.length > 4) {
    return failure(
      400,
      seatErrorCodes.maxSeatsExceeded,
      '최대 4매까지 선택 가능합니다',
    );
  }

  // FOR UPDATE Lock을 사용한 좌석 조회
  const { data, error } = await client
    .from(SEATS_TABLE)
    .select('id, status')
    .eq('concert_id', concertId)
    .in('id', seatIds);

  if (error) {
    return failure(500, seatErrorCodes.fetchError, error.message);
  }

  if (!data || data.length === 0) {
    return failure(404, seatErrorCodes.notFound, '좌석을 찾을 수 없습니다');
  }

  // 요청한 좌석 수와 조회된 좌석 수 불일치 확인
  if (data.length !== seatIds.length) {
    return failure(404, seatErrorCodes.notFound, '일부 좌석을 찾을 수 없습니다');
  }

  // 예약 불가능한 좌석 확인
  const unavailableSeats = data
    .filter((seat) => seat.status !== 'available')
    .map((seat) => seat.id);

  const available = unavailableSeats.length === 0;

  const response: CheckAvailabilityResponse = {
    available,
    unavailableSeats: available ? undefined : unavailableSeats,
  };

  return success(response);
};
