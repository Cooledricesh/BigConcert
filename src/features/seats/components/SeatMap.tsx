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
      <CardContent>
        <div className="space-y-8">
          {/* 무대 */}
          <div className="bg-gray-200 dark:bg-gray-700 py-4 text-center rounded-md">
            <span className="text-lg font-bold">STAGE</span>
          </div>

          {/* 좌석 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
