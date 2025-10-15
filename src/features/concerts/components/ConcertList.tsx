// src/features/concerts/components/ConcertList.tsx
'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useConcerts } from '../hooks/useConcerts';
import { ConcertCard } from './ConcertCard';
import { ConcertListSkeleton } from './ConcertListSkeleton';

export function ConcertList() {
  const router = useRouter();
  const { data: concerts, isLoading, error, refetch } = useConcerts();

  // 로딩 상태
  if (isLoading) {
    return <ConcertListSkeleton />;
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>콘서트 목록을 불러올 수 없습니다</AlertTitle>
          <AlertDescription>
            네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()}>다시 시도</Button>
      </div>
    );
  }

  // 빈 상태
  if (!concerts || concerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">예약 가능한 콘서트가 없습니다</h3>
          <p className="text-muted-foreground">새로운 공연이 곧 추가될 예정입니다</p>
        </div>
      </div>
    );
  }

  // 정상 상태
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {concerts.map((concert) => (
        <ConcertCard
          key={concert.id}
          concert={concert}
          onClick={() => router.push(`/concerts/${concert.id}`)}
        />
      ))}
    </div>
  );
}
