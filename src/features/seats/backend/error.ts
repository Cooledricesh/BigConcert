// src/features/seats/backend/error.ts
export const seatErrorCodes = {
  notFound: 'SEAT_NOT_FOUND',
  fetchError: 'SEAT_FETCH_ERROR',
  validationError: 'SEAT_VALIDATION_ERROR',
  alreadyReserved: 'SEAT_ALREADY_RESERVED',
  invalidConcert: 'SEAT_INVALID_CONCERT',
  maxSeatsExceeded: 'SEAT_MAX_SEATS_EXCEEDED',
} as const;

type SeatErrorValue = (typeof seatErrorCodes)[keyof typeof seatErrorCodes];

export type SeatServiceError = SeatErrorValue;
