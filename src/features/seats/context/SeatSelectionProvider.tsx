// src/features/seats/context/SeatSelectionProvider.tsx
'use client';

import { useReducer, useEffect, useMemo, useCallback, useRef, createContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/remote/api-client';
import { seatReducer, initialState } from '../lib/reducer';
import type {
  SeatSelectionState,
  SeatSelectionContextValue,
  SeatGrade,
} from '../lib/types';
import type { SeatResponse } from '../lib/dto';
import {
  SeatListResponseSchema,
  CheckAvailabilityRequestSchema,
} from '../lib/dto';

interface SeatSelectionProviderProps {
  children: React.ReactNode;
  concertId: string;
  maxSeats?: number; // 기본값: 4
  syncInterval?: number; // 실시간 동기화 간격 (ms), 기본값: 3000
}

// Context 생성
export const SeatSelectionContext = createContext<SeatSelectionContextValue | null>(null);

// Provider 구현
export const SeatSelectionProvider: React.FC<SeatSelectionProviderProps> = ({
  children,
  concertId,
  maxSeats = 4,
  syncInterval = 3000,
}) => {
  const router = useRouter();

  // useReducer 초기화
  const [state, dispatch] = useReducer(seatReducer, {
    ...initialState,
    concertId,
    maxSeats,
  } as SeatSelectionState);

  // 동적 폴링 간격 관리
  const [dynamicInterval, setDynamicInterval] = useState(syncInterval);
  const lastInteractionRef = useRef(Date.now());

  // 사용자 인터랙션 추적
  const trackInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
    setDynamicInterval(3000); // 인터랙션 시 3초로 단축
  }, []);

  // 좌석 목록 로드
  const loadSeats = useCallback(async () => {
    dispatch({ type: 'LOAD_SEATS_REQUEST' });

    try {
      const response = await apiClient.get(`/api/concerts/${concertId}/seats`);
      const seats = SeatListResponseSchema.parse(response.data);

      dispatch({
        type: 'LOAD_SEATS_SUCCESS',
        payload: { seats },
      });
    } catch (error: any) {
      dispatch({
        type: 'LOAD_SEATS_FAILURE',
        payload: {
          type: 'NETWORK',
          message: '좌석 정보를 불러오는 중 문제가 발생했습니다',
          retryable: true,
        },
      });
    }
  }, [concertId]);

  // 좌석 목록 갱신 (폴링용)
  const refreshSeats = useCallback(async () => {
    try {
      const response = await apiClient.get(`/api/concerts/${concertId}/seats`);
      const seats = SeatListResponseSchema.parse(response.data);

      dispatch({
        type: 'SYNC_SEATS',
        payload: { seats },
      });
    } catch (error) {
      console.error('Failed to refresh seats:', error);
    }
  }, [concertId]);

  // 콘서트 정보 로드
  const loadConcertInfo = useCallback(async () => {
    try {
      const response = await apiClient.get(`/api/concerts/${concertId}`);
      const concert = response.data;

      dispatch({
        type: 'SET_CONCERT_INFO',
        payload: {
          title: concert.title,
          artist: concert.artist,
          date: concert.date,
          venue: concert.venue,
        },
      });
    } catch (error) {
      console.error('Failed to load concert info:', error);
    }
  }, [concertId]);

  // 좌석 선택 (낙관적 업데이트)
  const selectSeat = useCallback(
    async (seatId: string) => {
      trackInteraction();

      // 낙관적 업데이트
      dispatch({ type: 'SELECT_SEAT', payload: { seatId } });

      // 즉시 백엔드 검증
      try {
        const response = await apiClient.post('/api/seats/check-availability', {
          concertId,
          seatIds: [seatId],
        });

        if (!response.data.available) {
          // 이미 예약된 경우 선택 취소
          dispatch({ type: 'DESELECT_SEAT', payload: { seatId } });
          dispatch({
            type: 'SET_ERROR',
            payload: {
              type: 'ALREADY_RESERVED',
              message: '선택하신 좌석이 이미 예약되었습니다',
              retryable: false,
            },
          });

          // 좌석 상태 업데이트
          dispatch({
            type: 'UPDATE_SEAT_STATUS',
            payload: { seatId, status: 'reserved' },
          });
        }
      } catch (error) {
        dispatch({ type: 'DESELECT_SEAT', payload: { seatId } });
        dispatch({
          type: 'SET_ERROR',
          payload: {
            type: 'NETWORK',
            message: '좌석 확인 중 오류가 발생했습니다',
            retryable: true,
          },
        });
      }
    },
    [concertId, trackInteraction]
  );

  // 좌석 선택 해제
  const deselectSeat = useCallback((seatId: string) => {
    trackInteraction();
    dispatch({ type: 'DESELECT_SEAT', payload: { seatId } });
  }, [trackInteraction]);

  // 좌석 선택 토글
  const toggleSeat = useCallback(
    (seatId: string) => {
      const isSelected = state.selectedSeats.some((s) => s.seatId === seatId);
      if (isSelected) {
        deselectSeat(seatId);
      } else {
        selectSeat(seatId);
      }
    },
    [state.selectedSeats, selectSeat, deselectSeat]
  );

  // 전체 선택 해제
  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  // 좌석 가용성 확인
  const checkAvailability = useCallback(
    async (seatIds: string[]): Promise<boolean> => {
      try {
        const response = await apiClient.post('/api/seats/check-availability', {
          concertId,
          seatIds,
        });

        return response.data.available;
      } catch (error) {
        console.error('Failed to check availability:', error);
        return false;
      }
    },
    [concertId]
  );

  // Hover 상태 설정
  const setHoveredSeat = useCallback((seatId: string | null) => {
    dispatch({ type: 'SET_HOVER_SEAT', payload: { seatId } });
  }, []);

  // 에러 초기화
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // 예약 프로세스 진행
  const proceedToBooking = useCallback(async (): Promise<boolean> => {
    if (state.selectedSeats.length === 0) {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          type: 'NETWORK',
          message: '최소 1개 이상의 좌석을 선택해주세요',
          retryable: false,
        },
      });
      return false;
    }

    // 최종 가용성 확인
    const seatIds = state.selectedSeats.map((s) => s.seatId);
    const available = await checkAvailability(seatIds);

    if (!available) {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          type: 'ALREADY_RESERVED',
          message: '선택하신 좌석 중 일부가 이미 예약되었습니다',
          retryable: false,
        },
      });
      await refreshSeats();
      return false;
    }

    // 좌석 데이터 형식 변환 (SeatResponse 형식에 맞게)
    const seatsData = state.selectedSeats.map(s => {
      const seat = state.seats.find(seat => seat.id === s.seatId);
      return seat;
    }).filter(Boolean); // null/undefined 제거

    // 세션에 선택 정보 저장 (selected_seats 키 사용)
    const SELECTED_SEATS_KEY = 'selected_seats';
    const EXPIRY_MINUTES = 30;

    const storageData = {
      concertId,
      seats: seatsData,
      expiresAt: Date.now() + EXPIRY_MINUTES * 60 * 1000,
    };

    sessionStorage.setItem(SELECTED_SEATS_KEY, JSON.stringify(storageData));

    // 예약 정보 입력 페이지로 이동
    router.push(`/concerts/${concertId}/booking`);
    return true;
  }, [state.selectedSeats, state.totalPrice, state.seats, concertId, checkAvailability, refreshSeats, router]);

  // 선택 유효성 검증
  const validateSelection = useCallback((): boolean => {
    return state.selectedSeats.length > 0 && state.selectedSeats.length <= maxSeats;
  }, [state.selectedSeats, maxSeats]);

  // 초기 데이터 로드
  useEffect(() => {
    loadSeats();
    loadConcertInfo();
  }, [loadSeats, loadConcertInfo]);

  // 실시간 동기화 (폴링)
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastInteractionRef.current;

      // 10초 이상 인터랙션 없으면 폴링 간격 10초로 증가
      if (timeSinceLastInteraction > 10000 && dynamicInterval !== 10000) {
        setDynamicInterval(10000);
      }

      refreshSeats();
    }, dynamicInterval);

    return () => clearInterval(interval);
  }, [dynamicInterval, refreshSeats]);

  // Computed 값 계산
  const computed = useMemo(() => {
    const isReserveEnabled =
      state.selectedSeats.length > 0 &&
      state.selectedSeats.length <= maxSeats &&
      !state.isLoading;

    const canSelectMore = state.selectedSeats.length < maxSeats;

    const selectedCount = state.selectedSeats.length;

    const availableSeatsCount = state.seats.filter(
      (s) => s.status === 'available'
    ).length;

    const seatsBySection = new Map<string, SeatResponse[]>();
    state.seats.forEach((seat) => {
      const existing = seatsBySection.get(seat.section) || [];
      existing.push(seat);
      seatsBySection.set(seat.section, existing);
    });

    const priceByGrade = new Map<SeatGrade, number>();
    state.seats.forEach((seat) => {
      if (!priceByGrade.has(seat.grade)) {
        priceByGrade.set(seat.grade, seat.price);
      }
    });

    return {
      isReserveEnabled,
      canSelectMore,
      selectedCount,
      availableSeatsCount,
      seatsBySection,
      priceByGrade,
    };
  }, [state.seats, state.selectedSeats, state.isLoading, maxSeats]);

  // Actions 객체
  const actions = useMemo(
    () => ({
      loadSeats,
      refreshSeats,
      loadConcertInfo,
      selectSeat,
      deselectSeat,
      toggleSeat,
      clearSelection,
      checkAvailability,
      setHoveredSeat,
      clearError,
      proceedToBooking,
      validateSelection,
    }),
    [
      loadSeats,
      refreshSeats,
      loadConcertInfo,
      selectSeat,
      deselectSeat,
      toggleSeat,
      clearSelection,
      checkAvailability,
      setHoveredSeat,
      clearError,
      proceedToBooking,
      validateSelection,
    ]
  );

  // Helpers 객체
  const helpers = useMemo(
    () => ({
      getSeatById: (seatId: string) => state.seats.find((s) => s.id === seatId),

      getSeatLabel: (seat: SeatResponse) =>
        `${seat.section}-${seat.row}-${seat.number}`,

      getSeatColor: (seat: SeatResponse) => {
        if (seat.status === 'reserved') return 'bg-gray-300';

        const isSelected = state.selectedSeats.some((s) => s.seatId === seat.id);
        if (isSelected) {
          switch (seat.grade) {
            case 'Special':
              return 'bg-purple-700';
            case 'Premium':
              return 'bg-blue-700';
            case 'Advanced':
              return 'bg-green-700';
            case 'Regular':
              return 'bg-gray-700';
          }
        }

        switch (seat.grade) {
          case 'Special':
            return 'bg-purple-500';
          case 'Premium':
            return 'bg-blue-500';
          case 'Advanced':
            return 'bg-green-500';
          case 'Regular':
            return 'bg-gray-500';
        }
      },

      isSelected: (seatId: string) =>
        state.selectedSeats.some((s) => s.seatId === seatId),

      canSelect: (seatId: string) => {
        const seat = state.seats.find((s) => s.id === seatId);
        if (!seat || seat.status !== 'available') return false;
        const isSelected = state.selectedSeats.some((s) => s.seatId === seatId);
        if (isSelected) return true; // 이미 선택된 경우 해제 가능
        return state.selectedSeats.length < maxSeats;
      },
    }),
    [state.seats, state.selectedSeats, maxSeats]
  );

  // Context Value
  const value: SeatSelectionContextValue = {
    state,
    computed,
    actions,
    helpers,
  };

  return (
    <SeatSelectionContext.Provider value={value}>
      {children}
    </SeatSelectionContext.Provider>
  );
};
