// src/features/seats/lib/types.ts
import type { SeatResponse } from './dto';

// 좌석 등급 타입
export type SeatGrade = 'Special' | 'Premium' | 'Advanced' | 'Regular';

// 선택된 좌석 정보
export interface SelectedSeat {
  seatId: string;
  section: string;
  row: number;
  number: number;
  grade: SeatGrade;
  price: number;
  selectedAt: number; // 선택 시간 (타임스탬프)
}

// 에러 상태
export interface ErrorState {
  type: 'NETWORK' | 'MAX_SEATS' | 'ALREADY_RESERVED' | 'SESSION_EXPIRED' | 'INVALID_CONCERT';
  message: string;
  retryable: boolean;
}

// 좌석 선택 상태
export interface SeatSelectionState {
  // 좌석 데이터
  seats: SeatResponse[];

  // 선택 관련
  selectedSeats: SelectedSeat[];
  totalPrice: number;

  // UI 상태
  isLoading: boolean;
  error: ErrorState | null;
  hoveredSeatId: string | null;

  // 메타 정보
  concertId: string;
  concertInfo?: {
    title: string;
    artist: string;
    date: string;
    venue: string;
  };
  maxSeats: number; // 최대 선택 가능 좌석 수 (4)
  lastSyncTime: number; // 마지막 동기화 시간
}

// Action 타입 정의
export type SeatSelectionAction =
  // 데이터 로딩
  | { type: 'INIT_SEATS'; payload: { concertId: string } }
  | { type: 'LOAD_SEATS_REQUEST' }
  | { type: 'LOAD_SEATS_SUCCESS'; payload: { seats: SeatResponse[] } }
  | { type: 'LOAD_SEATS_FAILURE'; payload: ErrorState }
  | { type: 'SET_CONCERT_INFO'; payload: { title: string; artist: string; date: string; venue: string } }

  // 좌석 선택
  | { type: 'SELECT_SEAT'; payload: { seatId: string } }
  | { type: 'DESELECT_SEAT'; payload: { seatId: string } }
  | { type: 'TOGGLE_SEAT'; payload: { seatId: string } }
  | { type: 'CLEAR_SELECTION' }

  // 좌석 상태 업데이트
  | { type: 'UPDATE_SEAT_STATUS'; payload: { seatId: string; status: 'available' | 'reserved' } }
  | { type: 'BATCH_UPDATE_SEATS'; payload: { updates: Array<{ seatId: string; status: 'available' | 'reserved' }> } }
  | { type: 'SYNC_SEATS'; payload: { seats: SeatResponse[] } }

  // UI 상태
  | { type: 'SET_HOVER_SEAT'; payload: { seatId: string | null } }
  | { type: 'SET_ERROR'; payload: ErrorState }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

// Context Value 타입
export interface SeatSelectionContextValue {
  // 상태
  state: SeatSelectionState;

  // 파생 상태 (computed)
  computed: {
    isReserveEnabled: boolean;
    canSelectMore: boolean;
    selectedCount: number;
    availableSeatsCount: number;
    seatsBySection: Map<string, SeatResponse[]>;
    priceByGrade: Map<SeatGrade, number>;
  };

  // 액션
  actions: {
    // 데이터 로딩
    loadSeats: () => Promise<void>;
    refreshSeats: () => Promise<void>;
    loadConcertInfo: () => Promise<void>;

    // 좌석 선택
    selectSeat: (seatId: string) => void;
    deselectSeat: (seatId: string) => void;
    toggleSeat: (seatId: string) => void;
    clearSelection: () => void;

    // 좌석 가용성 확인 (API 통합)
    checkAvailability: (seatIds: string[]) => Promise<boolean>;

    // UI 인터랙션
    setHoveredSeat: (seatId: string | null) => void;
    clearError: () => void;

    // 예약 프로세스
    proceedToBooking: () => Promise<boolean>;
    validateSelection: () => boolean;
  };

  // 헬퍼 함수
  helpers: {
    getSeatById: (seatId: string) => SeatResponse | undefined;
    getSeatLabel: (seat: SeatResponse) => string;
    getSeatColor: (seat: SeatResponse) => string;
    isSelected: (seatId: string) => boolean;
    canSelect: (seatId: string) => boolean;
  };
}
