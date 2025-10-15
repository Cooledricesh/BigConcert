// src/features/concerts/components/ConcertDescription.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConcertDescriptionProps {
  description: string | null;
}

export function ConcertDescription({ description }: ConcertDescriptionProps) {
  if (!description) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>공연 소개</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
