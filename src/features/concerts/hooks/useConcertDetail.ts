// src/features/concerts/hooks/useConcertDetail.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import {
  ConcertDetailResponseSchema,
  type ConcertDetailResponse,
} from '../lib/dto';

export const useConcertDetail = (concertId: string) => {
  return useQuery<ConcertDetailResponse>({
    queryKey: ['concerts', concertId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/concerts/${concertId}`);
      return ConcertDetailResponseSchema.parse(response.data);
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
};
