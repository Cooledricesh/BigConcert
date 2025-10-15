// src/features/seats/lib/reducer.ts
import type {
  SeatSelectionState,
  SeatSelectionAction,
  SelectedSeat,
} from './types';
import type { SeatResponse } from './dto';

export const initialState: Omit<SeatSelectionState, 'concertId' | 'maxSeats'> = {
  seats: [],
  selectedSeats: [],
  totalPrice: 0,
  isLoading: false,
  error: null,
  hoveredSeatId: null,
  lastSyncTime: 0,
};

export const seatReducer = (
  state: SeatSelectionState,
  action: SeatSelectionAction,
): SeatSelectionState => {
  switch (action.type) {
    // 데이터 로딩
    case 'INIT_SEATS':
      return {
        ...state,
        concertId: action.payload.concertId,
        isLoading: true,
        error: null,
      };

    case 'LOAD_SEATS_REQUEST':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'LOAD_SEATS_SUCCESS':
      return {
        ...state,
        seats: action.payload.seats,
        isLoading: false,
        error: null,
        lastSyncTime: Date.now(),
      };

    case 'LOAD_SEATS_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case 'SET_CONCERT_INFO':
      return {
        ...state,
        concertInfo: action.payload,
      };

    // 좌석 선택
    case 'SELECT_SEAT': {
      const { seatId } = action.payload;
      const seat = state.seats.find((s) => s.id === seatId);

      if (!seat) return state;
      if (seat.status !== 'available') return state;
      if (state.selectedSeats.length >= state.maxSeats) {
        return {
          ...state,
          error: {
            type: 'MAX_SEATS',
            message: `최대 ${state.maxSeats}매까지 선택 가능합니다`,
            retryable: false,
          },
        };
      }
      if (state.selectedSeats.some((s) => s.seatId === seatId)) return state;

      const selectedSeat: SelectedSeat = {
        seatId: seat.id,
        section: seat.section,
        row: seat.row,
        number: seat.number,
        grade: seat.grade,
        price: seat.price,
        selectedAt: Date.now(),
      };

      return {
        ...state,
        selectedSeats: [...state.selectedSeats, selectedSeat],
        totalPrice: state.totalPrice + seat.price,
        error: null,
      };
    }

    case 'DESELECT_SEAT': {
      const { seatId } = action.payload;
      const selectedSeat = state.selectedSeats.find((s) => s.seatId === seatId);

      if (!selectedSeat) return state;

      return {
        ...state,
        selectedSeats: state.selectedSeats.filter((s) => s.seatId !== seatId),
        totalPrice: state.totalPrice - selectedSeat.price,
      };
    }

    case 'TOGGLE_SEAT': {
      const { seatId } = action.payload;
      const isSelected = state.selectedSeats.some((s) => s.seatId === seatId);

      if (isSelected) {
        return seatReducer(state, { type: 'DESELECT_SEAT', payload: { seatId } });
      } else {
        return seatReducer(state, { type: 'SELECT_SEAT', payload: { seatId } });
      }
    }

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedSeats: [],
        totalPrice: 0,
      };

    // 좌석 상태 업데이트
    case 'UPDATE_SEAT_STATUS': {
      const { seatId, status } = action.payload;
      return {
        ...state,
        seats: state.seats.map((seat) =>
          seat.id === seatId ? { ...seat, status } : seat
        ),
        lastSyncTime: Date.now(),
      };
    }

    case 'BATCH_UPDATE_SEATS': {
      const updateMap = new Map(
        action.payload.updates.map((u) => [u.seatId, u.status])
      );

      return {
        ...state,
        seats: state.seats.map((seat) => {
          const newStatus = updateMap.get(seat.id);
          return newStatus ? { ...seat, status: newStatus } : seat;
        }),
        lastSyncTime: Date.now(),
      };
    }

    case 'SYNC_SEATS': {
      const newSeatsMap = new Map(action.payload.seats.map((s) => [s.id, s]));

      return {
        ...state,
        seats: state.seats.map((seat) => newSeatsMap.get(seat.id) || seat),
        lastSyncTime: Date.now(),
      };
    }

    // UI 상태
    case 'SET_HOVER_SEAT':
      return {
        ...state,
        hoveredSeatId: action.payload.seatId,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
};
