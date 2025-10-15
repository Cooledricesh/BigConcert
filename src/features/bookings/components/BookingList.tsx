'use client';

import { BookingCard } from './BookingCard';
import type { BookingDetailWithFormattedSeats } from '../lib/dto';

interface BookingListProps {
  bookings: BookingDetailWithFormattedSeats[];
}

export function BookingList({ bookings }: BookingListProps) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">예약 내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        총 {bookings.length}건의 예약이 있습니다
      </p>
      {bookings.map((booking) => (
        <BookingCard key={booking.bookingId} booking={booking} />
      ))}
    </div>
  );
}
