'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { SeatResponse } from '@/features/seats/lib/dto';

interface SeatsSummaryProps {
  seats: SeatResponse[];
}

const gradeColors: Record<string, string> = {
  Special: 'bg-purple-500',
  Premium: 'bg-blue-500',
  Advanced: 'bg-green-500',
  Regular: 'bg-gray-500',
};

export function SeatsSummary({ seats }: SeatsSummaryProps) {
  const totalPrice = seats.reduce((sum, seat) => sum + seat.price, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">선택 좌석</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {seats.map((seat) => (
            <div key={seat.id} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <Badge className={`${gradeColors[seat.grade]} text-white`}>
                  {seat.grade}
                </Badge>
                <span className="font-medium">
                  {seat.section}-{seat.row}-{seat.number}
                </span>
              </div>
              <span className="font-medium">
                {seat.price.toLocaleString()}원
              </span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>좌석 수</span>
            <span>{seats.length}매</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center font-bold text-lg">
          <span>총 금액</span>
          <span className="text-primary">{totalPrice.toLocaleString()}원</span>
        </div>
      </CardContent>
    </Card>
  );
}