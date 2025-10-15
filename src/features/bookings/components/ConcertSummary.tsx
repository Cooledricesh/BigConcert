'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, MapPin, Music } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConcertSummaryProps {
  title: string;
  artist: string;
  date: string;
  venue: string;
}

export function ConcertSummary({ title, artist, date, venue }: ConcertSummaryProps) {
  const formattedDate = format(new Date(date), 'yyyy년 M월 d일 (E) HH:mm', {
    locale: ko,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">공연 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h3 className="font-bold text-xl">{title}</h3>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <Music className="h-4 w-4" />
            <span>{artist}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formattedDate}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{venue}</span>
        </div>
      </CardContent>
    </Card>
  );
}