// src/features/seats/components/ErrorBoundary.tsx
'use client';

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useSeatSelection } from '../hooks/useSeatSelection';

export function ErrorBoundary() {
  const { state, actions } = useSeatSelection();
  const { error } = state;

  if (!error) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>오류가 발생했습니다</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{error.message}</p>
        {error.retryable && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              actions.clearError();
              actions.refreshSeats();
            }}
          >
            다시 시도
          </Button>
        )}
        {!error.retryable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={actions.clearError}
          >
            닫기
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
