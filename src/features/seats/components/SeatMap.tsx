// src/features/seats/components/SeatMap.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSeatSelection } from '../hooks/useSeatSelection';
import { SeatGrid } from './SeatGrid';

export function SeatMap() {
  const { computed } = useSeatSelection();
  const { seatsBySection } = computed;

  const sections = ['A', 'B', 'C', 'D'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>좌석 배치도</CardTitle>
      </CardHeader>
      <CardContent className="p-3 lg:p-6">
        <div className="space-y-6">
          {/* 무대 */}
          <div className="bg-gray-200 dark:bg-gray-700 py-3 lg:py-4 text-center rounded-md">
            <span className="text-base lg:text-lg font-bold">STAGE</span>
          </div>

          {/* 좌석 그리드 - 모바일: 2x2, 태블릿 이상: 1x4 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
            {sections.map((section) => (
              <SeatGrid
                key={section}
                section={section}
                seats={seatsBySection.get(section) || []}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
