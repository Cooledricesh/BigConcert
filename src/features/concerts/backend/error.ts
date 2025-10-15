// src/features/concerts/backend/error.ts
export const concertErrorCodes = {
  notFound: 'CONCERT_NOT_FOUND',
  fetchError: 'CONCERT_FETCH_ERROR',
  validationError: 'CONCERT_VALIDATION_ERROR',
  invalidDateFormat: 'CONCERT_INVALID_DATE_FORMAT',
} as const;

type ConcertErrorValue = (typeof concertErrorCodes)[keyof typeof concertErrorCodes];

export type ConcertServiceError = ConcertErrorValue;
