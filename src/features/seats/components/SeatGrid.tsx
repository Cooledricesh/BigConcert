// src/features/seats/components/SeatGrid.tsx
'use client';

import type { SeatResponse } from '../lib/dto';
import { Seat } from './Seat';

interface SeatGridProps {
  section: string;
  seats: SeatResponse[];
}

export function SeatGrid({ section, seats }: SeatGridProps) {
  // 열별로 좌석 그룹화
  const seatsByRow = new Map<number, SeatResponse[]>();
  seats.forEach((seat) => {
    const existing = seatsByRow.get(seat.row) || [];
    existing.push(seat);
    seatsByRow.set(seat.row, existing);
  });

  // 열 정렬 (1-20)
  const rows = Array.from({ length: 20 }, (_, i) => i + 1);

  return (
    <div className="border rounded-lg p-4">
      <div className="text-center font-bold mb-4 text-lg">
        {section} 구역
      </div>
      <div className="space-y-2">
        {rows.map((row) => {
          const rowSeats = seatsByRow.get(row) || [];
          // 좌석 번호 순 정렬
          rowSeats.sort((a, b) => a.number - b.number);

          return (
            <div key={row} className="flex items-center gap-2">
              {/* 열 번호 */}
              <div className="w-8 text-center text-sm font-medium">
                {row}
              </div>

              {/* 좌석 버튼 */}
              <div className="flex gap-1">
                {rowSeats.map((seat) => (
                  <Seat key={seat.id} seat={seat} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
