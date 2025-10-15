import type { SeatResponse } from '@/features/seats/lib/dto';

const SELECTED_SEATS_KEY = 'selected_seats';
const EXPIRY_MINUTES = 30;

export interface SelectedSeatsData {
  concertId: string;
  seats: SeatResponse[];
  expiresAt: number;
}

/**
 * 선택 좌석 정보 저장
 */
export const saveSelectedSeats = (concertId: string, seats: SeatResponse[]) => {
  const data: SelectedSeatsData = {
    concertId,
    seats,
    expiresAt: Date.now() + EXPIRY_MINUTES * 60 * 1000,
  };

  try {
    sessionStorage.setItem(SELECTED_SEATS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save selected seats:', error);
  }
};

/**
 * 선택 좌석 정보 조회
 * - 만료된 경우 자동 삭제
 */
export const loadSelectedSeats = (): SelectedSeatsData | null => {
  try {
    const stored = sessionStorage.getItem(SELECTED_SEATS_KEY);
    if (!stored) return null;

    const data: SelectedSeatsData = JSON.parse(stored);

    // TTL 체크
    if (Date.now() > data.expiresAt) {
      sessionStorage.removeItem(SELECTED_SEATS_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to load selected seats:', error);
    sessionStorage.removeItem(SELECTED_SEATS_KEY);
    return null;
  }
};

/**
 * 선택 좌석 정보 삭제
 */
export const clearSelectedSeats = () => {
  try {
    sessionStorage.removeItem(SELECTED_SEATS_KEY);
  } catch (error) {
    console.error('Failed to clear selected seats:', error);
  }
};

/**
 * 선택 좌석 유효성 확인
 * - 해당 콘서트의 좌석인지 확인
 * - TTL 만료 여부 확인
 */
export const validateSelectedSeats = (concertId: string): boolean => {
  const data = loadSelectedSeats();

  if (!data) return false;
  if (data.concertId !== concertId) return false;
  if (Date.now() > data.expiresAt) {
    clearSelectedSeats();
    return false;
  }

  return true;
};