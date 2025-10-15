// src/app/concerts/[id]/page.tsx
'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useConcertDetail } from '@/features/concerts/hooks/useConcertDetail';
import { ConcertDetailHeader } from '@/features/concerts/components/ConcertDetailHeader';
import { SeatGradeAvailability } from '@/features/concerts/components/SeatGradeAvailability';
import { ConcertDescription } from '@/features/concerts/components/ConcertDescription';
import { BookingButton } from '@/features/concerts/components/BookingButton';
import { ConcertDetailSkeleton } from '@/features/concerts/components/ConcertDetailSkeleton';

export default function ConcertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: concert, isLoading, error } = useConcertDetail(id);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Ticket className="h-6 w-6" />
            <h1 className="text-2xl font-bold">BigConcert</h1>
          </Link>

          <Link href="/bookings">
            <Button variant="outline">예약 조회</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Button>

          {isLoading && <ConcertDetailSkeleton />}

          {error && (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>콘서트를 불러올 수 없습니다</AlertTitle>
                <AlertDescription>
                  {(error as any)?.response?.status === 404
                    ? '존재하지 않는 콘서트입니다.'
                    : '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/')}>
                  홈으로
                </Button>
              </div>
            </div>
          )}

          {concert && (
            <>
              <ConcertDetailHeader
                title={concert.title}
                artist={concert.artist}
                venue={concert.venue}
                date={concert.date}
                posterImage={concert.posterImage}
              />

              <SeatGradeAvailability grades={concert.grades} />

              <ConcertDescription description={concert.description} />

              <BookingButton
                concertId={concert.id}
                date={concert.date}
                totalAvailableSeats={concert.totalAvailableSeats}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
