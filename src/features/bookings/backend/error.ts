export const bookingErrorCodes = {
  // 좌석 관련
  seatAlreadyReserved: 'SEAT_ALREADY_RESERVED',
  seatNotFound: 'SEAT_NOT_FOUND',
  invalidSeatSelection: 'INVALID_SEAT_SELECTION',

  // 중복 예약
  duplicateBooking: 'DUPLICATE_BOOKING',

  // 콘서트 관련
  concertNotFound: 'CONCERT_NOT_FOUND',
  concertExpired: 'CONCERT_EXPIRED',

  // 트랜잭션 및 시스템
  transactionFailed: 'TRANSACTION_FAILED',
  validationError: 'VALIDATION_ERROR',
  fetchError: 'BOOKING_FETCH_ERROR',
  databaseError: 'DATABASE_ERROR',

  // 예약 관련
  bookingNotFound: 'BOOKING_NOT_FOUND',
  bookingCancelled: 'BOOKING_CANCELLED',

  // 인증 관련 (예약 조회용)
  invalidCredentials: 'INVALID_CREDENTIALS',
  tooManyAttempts: 'TOO_MANY_ATTEMPTS',
} as const;

type BookingErrorValue = (typeof bookingErrorCodes)[keyof typeof bookingErrorCodes];

export type BookingServiceError = BookingErrorValue;

// 에러 메시지 맵
export const bookingErrorMessages: Record<BookingServiceError, string> = {
  [bookingErrorCodes.seatAlreadyReserved]: '선택하신 좌석 중 일부가 이미 예약되었습니다',
  [bookingErrorCodes.seatNotFound]: '선택하신 좌석을 찾을 수 없습니다',
  [bookingErrorCodes.invalidSeatSelection]: '잘못된 좌석 선택입니다',
  [bookingErrorCodes.duplicateBooking]: '이미 해당 공연을 예약하셨습니다',
  [bookingErrorCodes.concertNotFound]: '콘서트를 찾을 수 없습니다',
  [bookingErrorCodes.concertExpired]: '이미 종료된 콘서트입니다',
  [bookingErrorCodes.transactionFailed]: '예약 처리 중 오류가 발생했습니다',
  [bookingErrorCodes.validationError]: '입력값이 올바르지 않습니다',
  [bookingErrorCodes.fetchError]: '예약 정보를 불러올 수 없습니다',
  [bookingErrorCodes.databaseError]: '데이터베이스 오류가 발생했습니다',
  [bookingErrorCodes.bookingNotFound]: '예약을 찾을 수 없습니다',
  [bookingErrorCodes.bookingCancelled]: '취소된 예약입니다',
  [bookingErrorCodes.invalidCredentials]: '전화번호 또는 비밀번호가 일치하지 않습니다',
  [bookingErrorCodes.tooManyAttempts]: '잠시 후 다시 시도해주세요',
};