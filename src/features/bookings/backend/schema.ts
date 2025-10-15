import { z } from 'zod';

// 데이터베이스 Row 스키마
export const BookingTableRowSchema = z.object({
  id: z.string().uuid(),
  concert_id: z.string().uuid(),
  user_name: z.string(),
  user_phone: z.string(),
  password_hash: z.string(),
  total_price: z.number().int().positive(),
  status: z.enum(['confirmed', 'cancelled']),
  created_at: z.string().optional(), // DB timestamps return microseconds
  updated_at: z.string().optional(),
});

export type BookingTableRow = z.infer<typeof BookingTableRowSchema>;

// 예약 생성 요청
export const CreateBookingRequestSchema = z.object({
  concertId: z.string().uuid(),
  seatIds: z.array(z.string().uuid()).min(1).max(4),
  userName: z.string().min(2).max(50).transform(s => s.trim()),
  userPhone: z.string().regex(/^01[016789]\d{7,8}$/, '올바른 휴대전화 번호를 입력해주세요'),
  password: z.string().regex(/^[0-9]{4}$/, '비밀번호는 4자리 숫자여야 합니다'),
});

export type CreateBookingRequest = z.infer<typeof CreateBookingRequestSchema>;

// 좌석 정보 응답
export const BookingDetailSeatSchema = z.object({
  seatId: z.string().uuid(),
  section: z.enum(['A', 'B', 'C', 'D']),
  row: z.number().int().min(1).max(20),
  number: z.number().int().min(1).max(4),
  grade: z.enum(['Special', 'Premium', 'Advanced', 'Regular']),
  price: z.number().int().positive(),
});

export type BookingDetailSeat = z.infer<typeof BookingDetailSeatSchema>;

// 예약 생성 응답
export const CreateBookingResponseSchema = z.object({
  bookingId: z.string().uuid(),
  concertId: z.string().uuid(),
  concertTitle: z.string(),
  concertDate: z.string(),
  concertVenue: z.string(),
  seats: z.array(BookingDetailSeatSchema),
  userName: z.string(),
  userPhone: z.string(),
  totalPrice: z.number().int().positive(),
  status: z.enum(['confirmed', 'cancelled']),
  createdAt: z.string(),
});

export type CreateBookingResponse = z.infer<typeof CreateBookingResponseSchema>;

// booking_seats 테이블 Row 스키마
export const BookingSeatTableRowSchema = z.object({
  id: z.string().uuid(),
  booking_id: z.string().uuid(),
  seat_id: z.string().uuid(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type BookingSeatTableRow = z.infer<typeof BookingSeatTableRowSchema>;

// 예약 조회 응답 (향후 사용)
export const BookingDetailSchema = z.object({
  bookingId: z.string().uuid(),
  concertId: z.string().uuid(),
  concertTitle: z.string(),
  concertDate: z.string(),
  concertVenue: z.string(),
  concertArtist: z.string(),
  seats: z.array(BookingDetailSeatSchema),
  userName: z.string(),
  userPhone: z.string(),
  totalPrice: z.number().int().positive(),
  status: z.enum(['confirmed', 'cancelled']),
  createdAt: z.string(),
});

export type BookingDetail = z.infer<typeof BookingDetailSchema>;

// 예약 조회 요청 스키마
export const SearchBookingsRequestSchema = z.object({
  userPhone: z.string().regex(/^01[016789]\d{7,8}$/, '올바른 휴대전화 번호를 입력해주세요'),
  password: z.string().regex(/^[0-9]{4}$/, '비밀번호는 4자리 숫자여야 합니다'),
});

export type SearchBookingsRequest = z.infer<typeof SearchBookingsRequestSchema>;

// 포맷된 좌석 정보 추가 (기존 BookingDetailSeatSchema 확장)
export const BookingDetailSeatWithFormattedSchema = BookingDetailSeatSchema.extend({
  formatted: z.string(), // 예: A-1-3
});

export type BookingDetailSeatWithFormatted = z.infer<typeof BookingDetailSeatWithFormattedSchema>;

// BookingDetail에 formatted 좌석 정보 적용
export const BookingDetailWithFormattedSeatsSchema = BookingDetailSchema.extend({
  seats: z.array(BookingDetailSeatWithFormattedSchema),
});

export type BookingDetailWithFormattedSeats = z.infer<typeof BookingDetailWithFormattedSeatsSchema>;

// 최종 응답 스키마
export const FinalSearchBookingsResponseSchema = z.object({
  bookings: z.array(BookingDetailWithFormattedSeatsSchema),
});

export type FinalSearchBookingsResponse = z.infer<typeof FinalSearchBookingsResponseSchema>;