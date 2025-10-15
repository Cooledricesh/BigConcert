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
    <div className="border rounded-lg p-2 lg:p-3">
      <div className="text-center font-bold mb-2 lg:mb-3 text-sm lg:text-base">
        {section} 구역
      </div>
      <div className="space-y-1">
        {rows.map((row) => {
          const rowSeats = seatsByRow.get(row) || [];
          // 좌석 번호 순 정렬
          rowSeats.sort((a, b) => a.number - b.number);

          return (
            <div key={row} className="flex items-center gap-1">
              {/* 열 번호 */}
              <div className="w-5 lg:w-6 text-center text-xs lg:text-sm font-medium">
                {row}
              </div>

              {/* 좌석 버튼 */}
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((number) => {
                  const seat = rowSeats.find((s) => s.number === number);
                  if (seat) {
                    return <Seat key={seat.id} seat={seat} />;
                  } else {
                    // 빈 좌석 공간
                    return (
                      <div
                        key={`empty-${row}-${number}`}
                        className="w-6 h-6 lg:w-8 lg:h-8"
                      />
                    );
                  }
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
