'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSearchBookings } from '@/features/bookings/hooks/useSearchBookings';
import { BookingSearchForm } from '@/features/bookings/components/BookingSearchForm';
import { BookingList } from '@/features/bookings/components/BookingList';
import type { BookingDetailWithFormattedSeats } from '@/features/bookings/lib/dto';

export default function BookingsPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingDetailWithFormattedSeats[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const searchMutation = useSearchBookings();

  const handleSearch = (formData: { userPhone?: string; password?: string }) => {
    if (!formData.userPhone || !formData.password) {
      toast({
        title: '입력 오류',
        description: '전화번호와 비밀번호를 모두 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    const validFormData = {
      userPhone: formData.userPhone,
      password: formData.password,
    };

    searchMutation.mutate(validFormData, {
      onSuccess: (data) => {
        setBookings(data.bookings);
        setHasSearched(true);

        if (data.bookings.length === 0) {
          toast({
            title: '예약 내역이 없습니다',
            description: '입력하신 전화번호로 예약된 내역을 찾을 수 없습니다.',
          });
        } else {
          toast({
            title: '조회 완료',
            description: `${data.bookings.length}건의 예약을 찾았습니다.`,
          });
        }
      },
      onError: (error) => {
        const message = error.message || '예약 조회 중 오류가 발생했습니다';

        toast({
          title: '조회 실패',
          description: message,
          variant: 'destructive',
        });

        setBookings([]);
        setHasSearched(false);
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Ticket className="h-6 w-6" />
            <h1 className="text-2xl font-bold">BigConcert</h1>
          </Link>

          <Link href="/">
            <Button variant="outline">홈으로</Button>
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* 페이지 제목 */}
          <div>
            <h2 className="text-2xl font-bold">예약 조회</h2>
            <p className="text-muted-foreground mt-1">
              예약 시 입력한 전화번호와 비밀번호로 예약 내역을 확인하세요
            </p>
          </div>

          {/* 조회 폼 */}
          <BookingSearchForm
            onSubmit={handleSearch}
            isLoading={searchMutation.isPending}
          />

          {/* 예약 목록 */}
          {hasSearched && (
            <div>
              <h3 className="text-lg font-semibold mb-4">예약 내역</h3>
              <BookingList bookings={bookings} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
