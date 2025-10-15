'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BookingConfirmation } from '@/features/bookings/components/BookingConfirmation';
import { useBlockBack } from '@/features/bookings/hooks/useBlockBack';
import {
  loadBookingConfirmation,
  clearBookingConfirmation,
} from '@/features/bookings/lib/confirmationStorage';

export default function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: concertId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const bookingId = searchParams.get('id');
  const [bookingData, setBookingData] = useState(() => loadBookingConfirmation());

  // 뒤로가기 방지
  useBlockBack();

  // 예약 정보 없으면 홈으로 리다이렉트
  useEffect(() => {
    const storedBooking = loadBookingConfirmation();

    if (!storedBooking || !bookingId) {
      toast({
        title: '유효하지 않은 접근입니다',
        description: '예약 정보를 찾을 수 없습니다.',
        variant: 'destructive',
      });
      router.replace('/');
      return;
    }

    // 예약 ID가 일치하지 않으면 리다이렉트
    if (storedBooking.bookingId !== bookingId) {
      toast({
        title: '잘못된 예약 정보입니다',
        description: '예약 정보를 다시 확인해주세요.',
        variant: 'destructive',
      });
      router.replace('/');
      return;
    }

    setBookingData(storedBooking);
  }, [bookingId, router, toast]);

  // 페이지 이탈 시 예약 정보 정리
  // 주의: cleanup 함수를 사용하면 React StrictMode/Fast Refresh로 인해
  // 재마운트 시 sessionStorage가 삭제되는 문제가 발생합니다.
  // 대신 TTL(30분)에 의존하여 자동 만료되도록 하고,
  // "홈으로" 버튼에서만 명시적으로 정리합니다.

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
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

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <BookingConfirmation booking={bookingData} />
        </div>
      </main>
    </div>
  );
}