// src/features/seats/components/SelectionPanel.tsx
'use client';

import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSeatSelection } from '../hooks/useSeatSelection';

export function SelectionPanel() {
  const { state, computed, actions, helpers } = useSeatSelection();
  const { selectedSeats, totalPrice } = state;
  const { selectedCount, canSelectMore } = computed;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>선택한 좌석</CardTitle>
          <Badge variant="secondary">
            {selectedCount} / {state.maxSeats}매
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 선택 좌석 목록 */}
        {selectedSeats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            좌석을 선택해주세요
          </div>
        ) : (
          <div className="space-y-2">
            {selectedSeats.map((selected) => {
              const seat = helpers.getSeatById(selected.seatId);
              if (!seat) return null;

              return (
                <div
                  key={selected.seatId}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {helpers.getSeatLabel(seat)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {seat.grade} - {seat.price.toLocaleString()}원
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => actions.deselectSeat(selected.seatId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* 총 금액 */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-lg font-bold">
            <span>총 금액</span>
            <span className="text-primary">
              {totalPrice.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 전체 선택 해제 */}
        {selectedSeats.length > 0 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={actions.clearSelection}
          >
            전체 해제
          </Button>
        )}

        {/* 안내 메시지 */}
        {!canSelectMore && selectedCount < state.maxSeats && (
          <div className="text-sm text-muted-foreground text-center">
            최대 {state.maxSeats}매까지 선택 가능합니다
          </div>
        )}
      </CardContent>
    </Card>
  );
}
