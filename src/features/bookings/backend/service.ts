import type { SupabaseClient } from '@supabase/supabase-js';
import type { HandlerResult, SuccessResult, ErrorResult } from '@/backend/http/response';
import { failure, success } from '@/backend/http/response';
import type {
  CreateBookingRequest,
  CreateBookingResponse,
  BookingDetailSeat,
  SearchBookingsRequest,
  FinalSearchBookingsResponse,
} from './schema';
import { bookingErrorCodes, bookingErrorMessages, type BookingServiceError } from './error';

/**
 * 예약 생성 - 트랜잭션 기반 처리
 * Database Function을 사용하여 원자적으로 처리
 */
export const createBooking = async (
  client: SupabaseClient,
  request: CreateBookingRequest,
): Promise<HandlerResult<CreateBookingResponse, BookingServiceError, unknown>> => {
  const { concertId, seatIds, userName, userPhone, password } = request;

  // 1. 콘서트 존재 여부 및 유효성 확인
  const { data: concert, error: concertError } = await client
    .from('concerts')
    .select('id, title, date, venue, artist')
    .eq('id', concertId)
    .single();

  if (concertError || !concert) {
    return failure(
      404,
      bookingErrorCodes.concertNotFound,
      bookingErrorMessages[bookingErrorCodes.concertNotFound],
    );
  }

  // 콘서트 날짜가 지났는지 확인
  const concertDate = new Date(concert.date);
  if (concertDate < new Date()) {
    return failure(
      400,
      bookingErrorCodes.concertExpired,
      bookingErrorMessages[bookingErrorCodes.concertExpired],
    );
  }

  // 2. 비밀번호 해싱
  let passwordHash: string;
  try {
    const bcrypt = await import('bcryptjs');
    passwordHash = await bcrypt.hash(password, 10);
  } catch (error) {
    console.error('Password hashing failed:', error);
    return failure(
      500,
      bookingErrorCodes.transactionFailed,
      '비밀번호 처리 중 오류가 발생했습니다',
    );
  }

  // 3. 좌석 정보 가져오기 (가격 계산용)
  const { data: seats, error: seatsError } = await client
    .rpc('get_seats_for_booking', {
      p_seat_ids: seatIds,
    });

  if (seatsError || !seats || seats.length !== seatIds.length) {
    return failure(
      400,
      bookingErrorCodes.invalidSeatSelection,
      bookingErrorMessages[bookingErrorCodes.invalidSeatSelection],
    );
  }

  // 4. 총 금액 계산
  const totalPrice = seats.reduce((sum: number, seat: any) => sum + seat.price, 0);

  // 5. 트랜잭션 함수 실행
  const { data: bookingResult, error: transactionError } = await client
    .rpc('create_booking_transaction', {
      p_concert_id: concertId,
      p_seat_ids: seatIds,
      p_user_name: userName,
      p_user_phone: userPhone,
      p_password_hash: passwordHash,
      p_total_price: totalPrice,
    });

  // 에러 처리
  if (transactionError) {
    const errorMessage = transactionError.message || '';

    // 좌석 이미 예약됨
    if (errorMessage.includes('SEAT_ALREADY_RESERVED')) {
      return failure(
        409,
        bookingErrorCodes.seatAlreadyReserved,
        bookingErrorMessages[bookingErrorCodes.seatAlreadyReserved],
        { unavailableSeats: seatIds } // 실제로는 어떤 좌석인지 파악 필요
      );
    }

    // 중복 예약
    if (errorMessage.includes('DUPLICATE_BOOKING')) {
      return failure(
        409,
        bookingErrorCodes.duplicateBooking,
        bookingErrorMessages[bookingErrorCodes.duplicateBooking],
      );
    }

    console.error('Transaction failed:', transactionError);
    return failure(
      500,
      bookingErrorCodes.transactionFailed,
      bookingErrorMessages[bookingErrorCodes.transactionFailed],
    );
  }

  if (!bookingResult || bookingResult.length === 0) {
    return failure(
      500,
      bookingErrorCodes.transactionFailed,
      '예약 생성에 실패했습니다',
    );
  }

  // 6. 응답 데이터 구성
  const bookingId = bookingResult[0].booking_id;
  const createdAt = bookingResult[0].created_at;

  const bookingSeats: BookingDetailSeat[] = seats.map((seat: any) => ({
    seatId: seat.id,
    section: seat.section,
    row: seat.row,
    number: seat.number,
    grade: seat.grade,
    price: seat.price,
  }));

  const response: CreateBookingResponse = {
    bookingId,
    concertId: concert.id,
    concertTitle: concert.title,
    concertDate: concert.date,
    concertVenue: concert.venue,
    seats: bookingSeats,
    userName,
    userPhone,
    totalPrice,
    status: 'confirmed',
    createdAt,
  };

  return success(response, 201);
};

/**
 * 예약 조회 (향후 사용)
 */
export const getBookingDetail = async (
  client: SupabaseClient,
  bookingId: string,
): Promise<HandlerResult<CreateBookingResponse, BookingServiceError, unknown>> => {
  // 예약 정보 조회
  const { data: booking, error: bookingError } = await client
    .from('bookings')
    .select(`
      id,
      concert_id,
      user_name,
      user_phone,
      total_price,
      status,
      created_at,
      concerts!inner (
        id,
        title,
        date,
        venue,
        artist
      )
    `)
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return failure(
      404,
      bookingErrorCodes.bookingNotFound,
      bookingErrorMessages[bookingErrorCodes.bookingNotFound],
    );
  }

  // 예약된 좌석 정보 조회
  const { data: bookingSeats, error: seatsError } = await client
    .from('booking_seats')
    .select(`
      seats!inner (
        id,
        section,
        row,
        number,
        grade,
        price
      )
    `)
    .eq('booking_id', bookingId);

  if (seatsError || !bookingSeats) {
    return failure(
      500,
      bookingErrorCodes.fetchError,
      '좌석 정보를 불러올 수 없습니다',
    );
  }

  const seats: BookingDetailSeat[] = bookingSeats.map((bs: any) => ({
    seatId: bs.seats.id,
    section: bs.seats.section,
    row: bs.seats.row,
    number: bs.seats.number,
    grade: bs.seats.grade,
    price: bs.seats.price,
  }));

  // concerts를 배열에서 추출
  const concertData = Array.isArray(booking.concerts) ? booking.concerts[0] : booking.concerts;

  const response: CreateBookingResponse = {
    bookingId: booking.id,
    concertId: concertData.id,
    concertTitle: concertData.title,
    concertDate: concertData.date,
    concertVenue: concertData.venue,
    seats,
    userName: booking.user_name,
    userPhone: booking.user_phone,
    totalPrice: booking.total_price,
    status: booking.status,
    createdAt: booking.created_at,
  };

  return success(response);
};

/**
 * 예약 조회 서비스
 * - 전화번호로 예약 조회
 * - 비밀번호 해시 검증
 * - 예약 상세 정보 JOIN 조회
 * - 좌석 정보 포맷팅
 * - 최신순 정렬
 */
export const searchBookings = async (
  client: SupabaseClient,
  request: SearchBookingsRequest,
): Promise<HandlerResult<FinalSearchBookingsResponse, BookingServiceError, unknown>> => {
  const { userPhone, password } = request;

  // 1. 전화번호로 예약 조회
  const { data: bookings, error: bookingsError } = await client
    .from('bookings')
    .select('id, password_hash')
    .eq('user_phone', userPhone)
    .eq('status', 'confirmed');

  if (bookingsError) {
    return failure(500, bookingErrorCodes.databaseError, '데이터베이스 오류가 발생했습니다');
  }

  // 2. 예약이 없는 경우
  if (!bookings || bookings.length === 0) {
    // 빈 배열 반환 (추천)
    return success({ bookings: [] }, 200);
  }

  // 3. 비밀번호 검증 (첫 번째 예약의 비밀번호 해시 사용)
  // 주의: 동일 전화번호의 모든 예약은 동일한 비밀번호를 사용한다고 가정
  const firstBooking = bookings[0];
  let isPasswordValid: boolean;

  try {
    const bcrypt = await import('bcryptjs');
    isPasswordValid = await bcrypt.compare(password, firstBooking.password_hash);
  } catch (error) {
    console.error('Password comparison failed:', error);
    return failure(500, bookingErrorCodes.databaseError, '인증 처리 중 오류가 발생했습니다');
  }

  if (!isPasswordValid) {
    return failure(401, bookingErrorCodes.invalidCredentials, '전화번호 또는 비밀번호가 일치하지 않습니다');
  }

  // 4. 예약 상세 정보 조회 (JOIN)
  const bookingIds = bookings.map(b => b.id);

  const { data: bookingDetails, error: detailsError } = await client
    .from('bookings')
    .select(`
      id,
      concert_id,
      user_name,
      user_phone,
      total_price,
      status,
      created_at,
      concerts (
        id,
        title,
        artist,
        date,
        venue
      ),
      booking_seats (
        seats (
          id,
          section,
          row,
          number,
          grade,
          price
        )
      )
    `)
    .in('id', bookingIds)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false });

  if (detailsError || !bookingDetails) {
    return failure(500, bookingErrorCodes.fetchError, '예약 정보를 불러올 수 없습니다');
  }

  // 5. 데이터 가공
  const formattedBookings = bookingDetails.map(booking => {
    const concert = Array.isArray(booking.concerts) ? booking.concerts[0] : booking.concerts;

    if (!concert) {
      throw new Error('Concert data is missing');
    }

    // 좌석 정보 포맷팅
    const seats = booking.booking_seats
      .map(bs => {
        const seat = Array.isArray(bs.seats) ? bs.seats[0] : bs.seats;
        if (!seat) return null;

        return {
          seatId: seat.id,
          section: seat.section,
          row: seat.row,
          number: seat.number,
          grade: seat.grade,
          price: seat.price,
          formatted: `${seat.section}-${seat.row}-${seat.number}`, // 구역-열-번호
        };
      })
      .filter((seat): seat is any => seat !== null)
      .sort((a, b) => {
        // 구역 → 열 → 번호 순 정렬
        if (a.section !== b.section) return a.section.localeCompare(b.section);
        if (a.row !== b.row) return a.row - b.row;
        return a.number - b.number;
      });

    return {
      bookingId: booking.id,
      concertId: concert.id,
      concertTitle: concert.title,
      concertDate: concert.date,
      concertVenue: concert.venue,
      concertArtist: concert.artist,
      seats,
      userName: booking.user_name,
      userPhone: booking.user_phone,
      totalPrice: booking.total_price,
      status: booking.status,
      createdAt: booking.created_at,
    };
  });

  return success({ bookings: formattedBookings }, 200);
};