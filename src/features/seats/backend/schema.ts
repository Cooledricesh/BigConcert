// src/features/seats/backend/schema.ts
import { z } from 'zod';

// 데이터베이스 Row 스키마 (snake_case)
export const SeatTableRowSchema = z.object({
  id: z.string().uuid(),
  concert_id: z.string().uuid(),
  section: z.enum(['A', 'B', 'C', 'D']),
  row: z.number().int().min(1).max(20),
  number: z.number().int().min(1).max(4),
  grade: z.enum(['Special', 'Premium', 'Advanced', 'Regular']),
  price: z.number().int().positive(),
  status: z.enum(['available', 'reserved']),
  created_at: z.string().optional(), // datetime 검증 제거 (DB 형식이 다를 수 있음)
  updated_at: z.string().optional(), // datetime 검증 제거 (DB 형식이 다를 수 있음)
});

export type SeatRow = z.infer<typeof SeatTableRowSchema>;

// API 응답 스키마 (camelCase)
export const SeatResponseSchema = z.object({
  id: z.string().uuid(),
  concertId: z.string().uuid(),
  section: z.enum(['A', 'B', 'C', 'D']),
  row: z.number().int().min(1).max(20),
  number: z.number().int().min(1).max(4),
  grade: z.enum(['Special', 'Premium', 'Advanced', 'Regular']),
  price: z.number().int().positive(),
  status: z.enum(['available', 'reserved']),
});

export type SeatResponse = z.infer<typeof SeatResponseSchema>;

// 좌석 목록 응답 스키마
export const SeatListResponseSchema = z.array(SeatResponseSchema);

export type SeatListResponse = z.infer<typeof SeatListResponseSchema>;

// 좌석 가용성 확인 요청 스키마
export const CheckAvailabilityRequestSchema = z.object({
  concertId: z.string().uuid(),
  seatIds: z.array(z.string().uuid()).min(1).max(4),
});

export type CheckAvailabilityRequest = z.infer<typeof CheckAvailabilityRequestSchema>;

// 좌석 가용성 확인 응답 스키마
export const CheckAvailabilityResponseSchema = z.object({
  available: z.boolean(),
  unavailableSeats: z.array(z.string().uuid()).optional(),
});

export type CheckAvailabilityResponse = z.infer<typeof CheckAvailabilityResponseSchema>;
