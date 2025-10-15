'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CheckCircle2, Calendar, MapPin, User, Phone, Music, Ticket } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { CreateBookingResponse } from '../lib/dto';

interface BookingConfirmationProps {
  booking: CreateBookingResponse;
}

const gradeColors: Record<string, string> = {
  Special: 'bg-purple-500',
  Premium: 'bg-blue-500',
  Advanced: 'bg-green-500',
  Regular: 'bg-gray-500',
};

export function BookingConfirmation({ booking }: BookingConfirmationProps) {
  const formattedDate = format(
    new Date(booking.concertDate),
    'yyyy년 M월 d일 (E) HH:mm',
    { locale: ko }
  );

  const formattedBookingDate = format(
    new Date(booking.createdAt),
    'yyyy년 M월 d일 HH:mm:ss',
    { locale: ko }
  );

  return (
    <div className="space-y-6">
      {/* 완료 메시지 */}
      <div className="text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">예약이 완료되었습니다!</h2>
        <p className="text-muted-foreground mt-2">
          예약 정보를 확인해주세요
        </p>
      </div>

      {/* 예약 정보 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">예약 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 예약 번호 */}
          <div>
            <p className="text-sm text-muted-foreground">예약 번호</p>
            <p className="font-mono text-sm break-all">{booking.bookingId}</p>
          </div>

          <Separator />

          {/* 공연 정보 */}
          <div>
            <h3 className="font-bold text-lg mb-2">{booking.concertTitle}</h3>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formattedDate}</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{booking.concertVenue}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* 좌석 정보 */}
          <div>
            <p className="text-sm font-medium mb-2">선택 좌석 ({booking.seats.length}매)</p>
            <div className="space-y-2">
              {booking.seats.map((seat) => (
                <div key={seat.seatId} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className={`${gradeColors[seat.grade]} text-white`}>
                      {seat.grade}
                    </Badge>
                    <span className="font-medium">
                      {seat.section}-{seat.row}-{seat.number}
                    </span>
                  </div>
                  <span>{seat.price.toLocaleString()}원</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 예약자 정보 */}
          <div className="space-y-2">
            <p className="text-sm font-medium">예약자 정보</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{booking.userName}</span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{booking.userPhone}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* 예약 일시 */}
          <div>
            <p className="text-sm text-muted-foreground">예약 일시</p>
            <p className="text-sm">{formattedBookingDate}</p>
          </div>

          <Separator />

          {/* 총 금액 */}
          <div className="flex justify-between items-center font-bold text-lg">
            <span>총 금액</span>
            <span className="text-primary">
              {booking.totalPrice.toLocaleString()}원
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 안내 메시지 */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <Ticket className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">예약 확인 안내</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 예약 번호를 꼭 메모해두세요</li>
                <li>• 예약 조회는 전화번호와 비밀번호로 가능합니다</li>
                <li>• 공연 당일 예약 정보를 확인해주세요</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <div className="space-y-3">
        <Link href="/bookings" className="block">
          <Button className="w-full" size="lg">
            예약 조회 페이지로 이동
          </Button>
        </Link>

        <Link href="/" className="block">
          <Button variant="outline" className="w-full" size="lg">
            홈으로 돌아가기
          </Button>
        </Link>
      </div>
    </div>
  );
}