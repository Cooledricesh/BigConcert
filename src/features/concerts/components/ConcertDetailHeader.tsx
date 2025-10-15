// src/features/concerts/components/ConcertDetailHeader.tsx
'use client';

import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, MapPin, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ConcertDetailHeaderProps {
  title: string;
  artist: string;
  venue: string;
  date: string;
  posterImage: string | null;
}

export function ConcertDetailHeader({
  title,
  artist,
  venue,
  date,
  posterImage,
}: ConcertDetailHeaderProps) {
  const formattedDate = format(
    parseISO(date),
    'yyyy년 M월 d일 (EEE) a h시 mm분',
    { locale: ko }
  );

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="relative aspect-[2/3] w-full">
            <Image
              src={posterImage || 'https://picsum.photos/400/600'}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              priority
            />
          </div>
        </div>

        <CardContent className="md:col-span-2 p-6 space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-5 w-5" />
              <p className="text-lg">{artist}</p>
            </div>
          </div>

          <div className="space-y-3 text-base">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <p className="font-medium">공연 일시</p>
                <p className="text-muted-foreground">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <p className="font-medium">공연 장소</p>
                <p className="text-muted-foreground">{venue}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
