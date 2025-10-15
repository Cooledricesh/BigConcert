// 백엔드 스키마를 프론트엔드에서 사용하기 위한 재노출

export type {
  CreateBookingRequest,
  CreateBookingResponse,
  BookingDetailSeat,
  BookingDetail,
  SearchBookingsRequest,
  FinalSearchBookingsResponse,
  BookingDetailWithFormattedSeats,
  BookingDetailSeatWithFormatted,
} from '../backend/schema';

export {
  CreateBookingRequestSchema,
  CreateBookingResponseSchema,
  BookingDetailSeatSchema,
  BookingDetailSchema,
  SearchBookingsRequestSchema,
  FinalSearchBookingsResponseSchema,
  BookingDetailWithFormattedSeatsSchema,
  BookingDetailSeatWithFormattedSchema,
} from '../backend/schema';