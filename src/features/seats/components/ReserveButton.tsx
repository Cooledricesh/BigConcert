// src/features/seats/components/ReserveButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useSeatSelection } from '../hooks/useSeatSelection';

export function ReserveButton() {
  const { state, computed, actions } = useSeatSelection();
  const { isReserveEnabled, selectedCount } = computed;

  const handleReserve = () => {
    if (isReserveEnabled) {
      actions.proceedToBooking();
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleReserve}
        disabled={!isReserveEnabled}
        size="lg"
        className="w-full"
      >
        {selectedCount === 0
          ? '좌석을 선택해주세요'
          : `예약하기 (${selectedCount}매)`}
      </Button>

      {isReserveEnabled && (
        <p className="text-sm text-center text-muted-foreground">
          예약 정보 입력 페이지로 이동합니다
        </p>
      )}
    </div>
  );
}
