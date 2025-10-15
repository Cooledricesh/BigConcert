// src/features/seats/hooks/useSeatSelection.ts
'use client';

import { useContext } from 'react';
import { SeatSelectionContext } from '../context/SeatSelectionProvider';

export const useSeatSelection = () => {
  const context = useContext(SeatSelectionContext);

  if (!context) {
    throw new Error('useSeatSelection must be used within SeatSelectionProvider');
  }

  return context;
};
