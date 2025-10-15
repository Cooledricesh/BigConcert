import type { CreateBookingResponse } from './dto';

const BOOKING_CONFIRMATION_KEY = 'booking_confirmation';
const EXPIRY_MINUTES = 30;

export interface BookingConfirmationData {
  booking: CreateBookingResponse;
  expiresAt: number;
}

/**
 * 예약 완료 정보 저장
 */
export const saveBookingConfirmation = (booking: CreateBookingResponse) => {
  if (typeof window === 'undefined') return;

  const data: BookingConfirmationData = {
    booking,
    expiresAt: Date.now() + EXPIRY_MINUTES * 60 * 1000,
  };

  try {
    sessionStorage.setItem(BOOKING_CONFIRMATION_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save booking confirmation:', error);
  }
};

/**
 * 예약 완료 정보 조회
 */
export const loadBookingConfirmation = (): CreateBookingResponse | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem(BOOKING_CONFIRMATION_KEY);
    if (!stored) return null;

    const data: BookingConfirmationData = JSON.parse(stored);

    // TTL 체크
    if (Date.now() > data.expiresAt) {
      sessionStorage.removeItem(BOOKING_CONFIRMATION_KEY);
      return null;
    }

    return data.booking;
  } catch (error) {
    console.error('Failed to load booking confirmation:', error);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(BOOKING_CONFIRMATION_KEY);
    }
    return null;
  }
};

/**
 * 예약 완료 정보 삭제
 */
export const clearBookingConfirmation = () => {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(BOOKING_CONFIRMATION_KEY);
  } catch (error) {
    console.error('Failed to clear booking confirmation:', error);
  }
};

/**
 * 예약 완료 정보 유효성 확인
 * - 예약 ID 일치 여부 확인
 * - TTL 만료 여부 확인
 */
export const validateBookingConfirmation = (bookingId: string): boolean => {
  const booking = loadBookingConfirmation();

  if (!booking) return false;
  if (booking.bookingId !== bookingId) return false;

  return true;
};