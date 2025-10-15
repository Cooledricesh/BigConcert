'use client';

import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type { CreateBookingRequest, CreateBookingResponse } from '../lib/dto';
import { CreateBookingResponseSchema } from '../lib/dto';

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export const useCreateBooking = (): UseMutationResult<
  CreateBookingResponse,
  Error,
  CreateBookingRequest
> => {
  return useMutation({
    mutationFn: async (data: CreateBookingRequest) => {
      try {
        const response = await apiClient.post('/api/bookings', data);

        // 응답 검증
        const parsed = CreateBookingResponseSchema.safeParse(response.data);

        if (!parsed.success) {
          throw new Error('Invalid response format');
        }

        return parsed.data;
      } catch (error: any) {
        // Axios 에러인 경우
        if (error.response?.data?.error) {
          const errorMessage = error.response.data.error.message || '예약 처리 중 오류가 발생했습니다';
          const customError = new Error(errorMessage);
          (customError as any).code = error.response.data.error.code;
          (customError as any).details = error.response.data.error.details;
          throw customError;
        }

        throw error;
      }
    },
    onError: (error) => {
      console.error('Booking creation failed:', error);
    },
  });
};