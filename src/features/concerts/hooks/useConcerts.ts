// src/features/concerts/hooks/useConcerts.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { ConcertListResponseSchema, type ConcertListResponse } from '../lib/dto';

export const useConcerts = () => {
  return useQuery<ConcertListResponse>({
    queryKey: ['concerts'],
    queryFn: async () => {
      const response = await apiClient.get('/api/concerts');
      // 백엔드가 respond()로 반환하므로 response.data가 바로 배열
      return ConcertListResponseSchema.parse(response.data);
    },
    staleTime: 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분 (구 cacheTime)
    refetchOnWindowFocus: true,
    retry: 2,
  });
};
