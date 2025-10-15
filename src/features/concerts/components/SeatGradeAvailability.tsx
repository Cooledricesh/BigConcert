// src/features/concerts/components/SeatGradeAvailability.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SeatGradeInfo } from '../lib/dto';

interface SeatGradeAvailabilityProps {
  grades: SeatGradeInfo[];
}

const gradeColors = {
  Special: 'bg-purple-500',
  Premium: 'bg-blue-500',
  Advanced: 'bg-green-500',
  Regular: 'bg-gray-500',
} as const;

const gradeLabels = {
  Special: 'Special (1-3열)',
  Premium: 'Premium (4-7열)',
  Advanced: 'Advanced (8-15열)',
  Regular: 'Regular (16-20열)',
} as const;

export function SeatGradeAvailability({ grades }: SeatGradeAvailabilityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>등급별 좌석 현황</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {grades.map((grade) => {
          const isSoldOut = grade.availableSeats === 0;
          const colorClass = isSoldOut ? 'bg-gray-300' : gradeColors[grade.grade];

          return (
            <div key={grade.grade} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{gradeLabels[grade.grade]}</span>
                  {isSoldOut && (
                    <Badge variant="destructive" className="text-xs">
                      매진
                    </Badge>
                  )}
                </div>
                <span className="font-bold text-lg">
                  {grade.price.toLocaleString()}원
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 bg-secondary rounded-full h-3 overflow-hidden">
                  <div
                    className={`${colorClass} h-full transition-all duration-300`}
                    style={{ width: `${grade.availabilityRate}%` }}
                  />
                </div>

                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {grade.availableSeats} / {grade.totalSeats}석
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                잔여율: {grade.availabilityRate.toFixed(1)}%
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
