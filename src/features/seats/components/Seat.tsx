// src/features/seats/components/Seat.tsx
'use client';

import { useSeatSelection } from '../hooks/useSeatSelection';
import type { SeatResponse } from '../lib/dto';
import { cn } from '@/lib/utils';

interface SeatProps {
  seat: SeatResponse;
}

export function Seat({ seat }: SeatProps) {
  const { helpers, actions, state } = useSeatSelection();

  const isSelected = helpers.isSelected(seat.id);
  const canSelect = helpers.canSelect(seat.id);
  const seatLabel = helpers.getSeatLabel(seat);
  const seatColor = helpers.getSeatColor(seat);
  const isHovered = state.hoveredSeatId === seat.id;

  const handleClick = () => {
    if (canSelect || isSelected) {
      actions.toggleSeat(seat.id);
    }
  };

  const handleMouseEnter = () => {
    actions.setHoveredSeat(seat.id);
  };

  const handleMouseLeave = () => {
    actions.setHoveredSeat(null);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={seat.status === 'reserved'}
      className={cn(
        'w-6 h-6 lg:w-8 lg:h-8 rounded text-[10px] lg:text-xs font-medium transition-all',
        'flex items-center justify-center',
        'hover:scale-110 active:scale-95',
        seatColor,
        seat.status === 'reserved'
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer',
        isSelected && 'ring-1 lg:ring-2 ring-white scale-105',
        isHovered && !isSelected && 'scale-110',
        'text-white'
      )}
      title={`${seatLabel} - ${seat.grade} (${seat.price.toLocaleString()}원)`}
    >
      {seat.number}
    </button>
  );
}
