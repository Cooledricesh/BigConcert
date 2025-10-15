'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, MapPin, User, Ticket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { BookingDetailWithFormattedSeats } from '../lib/dto';

interface BookingCardProps {
  booking: BookingDetailWithFormattedSeats;
}

const gradeColors: Record<string, string> = {
  Special: 'bg-purple-100 text-purple-800',
  Premium: 'bg-blue-100 text-blue-800',
  Advanced: 'bg-green-100 text-green-800',
  Regular: 'bg-gray-100 text-gray-800',
};

export function BookingCard({ booking }: BookingCardProps) {
  const formattedConcertDate = format(
    new Date(booking.concertDate),
    'yyyy년 M월 d일 (E) HH:mm',
    { locale: ko }
  );

  const formattedBookingDate = format(
    new Date(booking.createdAt),
    'yyyy년 M월 d일 HH:mm',
    { locale: ko }
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{booking.concertTitle}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {booking.concertArtist}
            </p>
          </div>
          <Badge variant="outline" className="ml-2">
            {booking.status === 'confirmed' ? '예약 확정' : '취소됨'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 공연 정보 */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formattedConcertDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{booking.concertVenue}</span>
          </div>
        </div>

        <Separator />

        {/* 좌석 정보 */}
        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Ticket className="h-4 w-4 text-muted-foreground" />
            선택 좌석
          </p>
          <div className="space-y-1">
            {booking.seats.map((seat) => (
              <div key={seat.seatId} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{seat.formatted}</span>
                  <Badge className={gradeColors[seat.grade] || gradeColors.Regular}>
                    {seat.grade}
                  </Badge>
                </div>
                <span className="text-muted-foreground">
                  {seat.price.toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* 예약자 정보 */}
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{booking.userName}</span>
          </div>
          <div className="text-muted-foreground">
            예약 일시: {formattedBookingDate}
          </div>
        </div>

        <Separator />

        {/* 총 금액 */}
        <div className="flex justify-between items-center font-bold text-lg">
          <span>총 금액</span>
          <span className="text-primary">{booking.totalPrice.toLocaleString()}원</span>
        </div>
      </CardContent>
    </Card>
  );
}
