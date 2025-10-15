// src/features/concerts/components/ConcertCard.tsx
'use client';

import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ConcertResponse } from '../lib/dto';

interface ConcertCardProps {
  concert: ConcertResponse;
  onClick: () => void;
}

export function ConcertCard({ concert, onClick }: ConcertCardProps) {
  const isSoldOut = concert.availableSeats === 0;
  const availabilityPercent = (concert.availableSeats / concert.totalSeats) * 100;

  const formattedDate = format(parseISO(concert.date), 'yyyy년 M월 d일 (EEE) HH:mm', {
    locale: ko,
  });

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] relative overflow-hidden"
      onClick={onClick}
    >
      {isSoldOut && (
        <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
          <Badge variant="destructive" className="text-xl px-6 py-2">
            매진
          </Badge>
        </div>
      )}

      <div className="relative aspect-[2/3] w-full">
        <Image
          src={concert.posterImage || 'https://picsum.photos/400/600'}
          alt={concert.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <CardContent className="p-4 space-y-2">
        <h3 className="font-bold text-lg line-clamp-1">{concert.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">{concert.artist}</p>

        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="line-clamp-1">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{concert.venue}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className={isSoldOut ? 'text-destructive' : 'text-primary'}>
              잔여 {concert.availableSeats}석 / 전체 {concert.totalSeats}석
            </span>
          </div>
        </div>

        {!isSoldOut && (
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${availabilityPercent}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
