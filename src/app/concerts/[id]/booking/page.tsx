'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useConcertDetail } from '@/features/concerts/hooks/useConcertDetail';
import { useCreateBooking } from '@/features/bookings/hooks/useCreateBooking';
import { ConcertSummary } from '@/features/bookings/components/ConcertSummary';
import { SeatsSummary } from '@/features/bookings/components/SeatsSummary';
import { BookingForm } from '@/features/bookings/components/BookingForm';
import {
  loadSelectedSeats,
  clearSelectedSeats,
} from '@/features/bookings/lib/storage';
import { saveBookingConfirmation } from '@/features/bookings/lib/confirmationStorage';
import type { CreateBookingRequest } from '@/features/bookings/lib/dto';

export default function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: concertId } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [selectedSeatsData, setSelectedSeatsData] = useState(() =>
    loadSelectedSeats()
  );

  // 콘서트 정보 조회
  const { data: concert, isLoading: isConcertLoading } = useConcertDetail(concertId);

  // 예약 생성 mutation
  const createBookingMutation = useCreateBooking();

  // 선택 좌석 없으면 좌석 선택 페이지로 리다이렉트
  useEffect(() => {
    const seatsData = loadSelectedSeats();

    if (!seatsData || seatsData.concertId !== concertId) {
      toast({
        title: '좌석 선택 정보가 없습니다',
        description: '좌석을 먼저 선택해주세요.',
        variant: 'destructive',
      });
      router.push(`/concerts/${concertId}/seats`);
    } else {
      setSelectedSeatsData(seatsData);
    }
  }, [concertId, router, toast]);

  const handleBookingSubmit = async (formData: {
    userName?: string;
    userPhone?: string;
    password?: string;
  }) => {
    // 필수 필드 검증 (form에서 이미 검증되었지만 타입 안정성을 위해)
    if (!formData.userName || !formData.userPhone || !formData.password) {
      toast({
        title: '입력 오류',
        description: '모든 필드를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedSeatsData) return;

    const requestData: CreateBookingRequest = {
      concertId,
      seatIds: selectedSeatsData.seats.map((seat) => seat.id),
      userName: formData.userName.trim(),
      userPhone: formData.userPhone,
      password: formData.password,
    };

    createBookingMutation.mutate(requestData, {
      onSuccess: (data) => {
        // 선택 좌석 정보 삭제
        clearSelectedSeats();

        // 예약 완료 정보 저장
        saveBookingConfirmation(data);

        toast({
          title: '예약이 완료되었습니다',
          description: `예약 번호: ${data.bookingId.substring(0, 8)}...`,
        });

        // 예약 완료 페이지로 이동
        router.push(`/concerts/${concertId}/confirmation?id=${data.bookingId}`);
      },
      onError: (error: any) => {
        const errorCode = error.code;
        const errorMessage = error.message || '예약 처리 중 오류가 발생했습니다';

        // 좌석 충돌 에러인 경우
        if (errorCode === 'SEAT_ALREADY_RESERVED') {
          toast({
            title: '좌석 예약 실패',
            description: '선택하신 좌석 중 일부가 이미 예약되었습니다. 다른 좌석을 선택해주세요.',
            variant: 'destructive',
          });

          clearSelectedSeats();
          router.push(`/concerts/${concertId}/seats`);
        }
        // 중복 예약 에러인 경우
        else if (errorCode === 'DUPLICATE_BOOKING') {
          toast({
            title: '중복 예약',
            description: '이미 해당 공연을 예약하셨습니다. 예약 조회 페이지에서 확인해주세요.',
            variant: 'destructive',
          });
        }
        // 기타 에러
        else {
          toast({
            title: '예약 실패',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      },
    });
  };

  if (isConcertLoading || !concert || !selectedSeatsData) {
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
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 페이지 제목 */}
          <div>
            <h2 className="text-2xl font-bold">예약 정보 입력</h2>
            <p className="text-muted-foreground mt-1">
              예약자 정보를 입력해주세요
            </p>
          </div>

          {/* 콘서트 정보 */}
          <ConcertSummary
            title={concert.title}
            artist={concert.artist}
            date={concert.date}
            venue={concert.venue}
          />

          {/* 선택 좌석 정보 */}
          <SeatsSummary seats={selectedSeatsData.seats} />

          {/* 예약자 정보 입력 폼 */}
          <BookingForm
            onSubmit={handleBookingSubmit}
            isLoading={createBookingMutation.isPending}
          />

          {/* 이전 버튼 */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="w-full"
            disabled={createBookingMutation.isPending}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            이전으로
          </Button>
        </div>
      </main>
    </div>
  );
}