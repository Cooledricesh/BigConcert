// src/app/concerts/[id]/seats/page.tsx
'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeatSelectionProvider } from '@/features/seats/context/SeatSelectionProvider';
import { useSeatSelection } from '@/features/seats/hooks/useSeatSelection';
import { SeatMap } from '@/features/seats/components/SeatMap';
import { SelectionPanel } from '@/features/seats/components/SelectionPanel';
import { PriceDisplay } from '@/features/seats/components/PriceDisplay';
import { ReserveButton } from '@/features/seats/components/ReserveButton';
import { ErrorBoundary } from '@/features/seats/components/ErrorBoundary';
import { SeatMapSkeleton } from '@/features/seats/components/SeatMapSkeleton';

// 내부 컴포넌트 (Provider 내부에서만 사용)
function SeatSelectionContent() {
  const { state } = useSeatSelection();
  const router = useRouter();

  if (state.isLoading && state.seats.length === 0) {
    return <SeatMapSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* 에러 메시지 */}
      <ErrorBoundary />

      {/* 가격 안내 */}
      <PriceDisplay />

      {/* 좌석 배치도 */}
      <SeatMap />

      {/* 선택 정보 패널 */}
      <SelectionPanel />

      {/* 예약 버튼 */}
      <ReserveButton />

      {/* 뒤로가기 버튼 */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="w-full"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        이전으로
      </Button>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function SeatSelectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

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
      <main className="container mx-auto px-2 lg:px-4 py-4 lg:py-8">
        <div className="max-w-full xl:max-w-[1600px] mx-auto">
          <SeatSelectionProvider concertId={id}>
            <SeatSelectionContent />
          </SeatSelectionProvider>
        </div>
      </main>
    </div>
  );
}
