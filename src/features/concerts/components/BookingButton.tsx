// src/features/concerts/components/BookingButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { parseISO, isBefore } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface BookingButtonProps {
  concertId: string;
  date: string;
  totalAvailableSeats: number;
}

export function BookingButton({
  concertId,
  date,
  totalAvailableSeats,
}: BookingButtonProps) {
  const router = useRouter();

  const concertDate = parseISO(date);
  const isExpired = isBefore(concertDate, new Date());
  const isSoldOut = totalAvailableSeats === 0;

  const canBook = !isExpired && !isSoldOut;

  const handleBooking = () => {
    if (canBook) {
      router.push(`/concerts/${concertId}/seats`);
    }
  };

  return (
    <div className="space-y-4">
      {isExpired && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>이미 종료된 공연입니다.</AlertDescription>
        </Alert>
      )}

      {isSoldOut && !isExpired && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>모든 좌석이 매진되었습니다.</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleBooking}
        disabled={!canBook}
        size="lg"
        className="w-full"
      >
        {isExpired
          ? '공연 종료'
          : isSoldOut
          ? '매진'
          : `예약하기 (잔여 ${totalAvailableSeats}석)`}
      </Button>

      {canBook && (
        <p className="text-sm text-center text-muted-foreground">
          좌석 선택 페이지로 이동합니다
        </p>
      )}
    </div>
  );
}
