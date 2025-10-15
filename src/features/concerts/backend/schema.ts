// src/features/concerts/backend/schema.ts
import { z } from 'zod';

// 데이터베이스 Row 스키마 (snake_case)
export const ConcertTableRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  artist: z.string(),
  venue: z.string(),
  date: z.string().datetime(), // ISO 8601 format
  poster_image: z.string().nullable(),
  description: z.string().nullable(),
  total_seats: z.number().int().nonnegative(),
  available_seats: z.number().int().nonnegative(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type ConcertRow = z.infer<typeof ConcertTableRowSchema>;

// API 응답 스키마 (camelCase)
export const ConcertResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  artist: z.string(),
  venue: z.string(),
  date: z.string().datetime(),
  posterImage: z.string().nullable(),
  description: z.string().nullable(),
  totalSeats: z.number().int().nonnegative(),
  availableSeats: z.number().int().nonnegative(),
});

export type ConcertResponse = z.infer<typeof ConcertResponseSchema>;

// 콘서트 목록 응답 스키마
export const ConcertListResponseSchema = z.array(ConcertResponseSchema);

export type ConcertListResponse = z.infer<typeof ConcertListResponseSchema>;
