// src/features/seats/components/PriceDisplay.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSeatSelection } from '../hooks/useSeatSelection';

const gradeInfo = {
  Special: { label: 'Special (1-3열)', color: 'bg-purple-500' },
  Premium: { label: 'Premium (4-7열)', color: 'bg-blue-500' },
  Advanced: { label: 'Advanced (8-15열)', color: 'bg-green-500' },
  Regular: { label: 'Regular (16-20열)', color: 'bg-gray-500' },
} as const;

export function PriceDisplay() {
  const { computed } = useSeatSelection();
  const { priceByGrade } = computed;

  const grades = ['Special', 'Premium', 'Advanced', 'Regular'] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>등급별 가격</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {grades.map((grade) => {
            const price = priceByGrade.get(grade);
            if (!price) return null;

            const info = gradeInfo[grade];

            return (
              <div
                key={grade}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${info.color}`} />
                  <span className="font-medium">{info.label}</span>
                </div>
                <span className="font-bold">{price.toLocaleString()}원</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
