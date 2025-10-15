'use client';

import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type { SearchBookingsRequest, FinalSearchBookingsResponse } from '../lib/dto';
import { FinalSearchBookingsResponseSchema } from '../lib/dto';

export const useSearchBookings = (): UseMutationResult<
  FinalSearchBookingsResponse,
  Error,
  SearchBookingsRequest
> => {
  return useMutation({
    mutationFn: async (data: SearchBookingsRequest) => {
      const response = await apiClient.post<FinalSearchBookingsResponse>(
        '/api/bookings/search',
        data,
      );

      // 응답 검증
      const parsed = FinalSearchBookingsResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error('Invalid response format');
      }

      return parsed.data;
    },
    onError: (error) => {
      console.error('Booking search failed:', extractApiErrorMessage(error));
    },
  });
};
