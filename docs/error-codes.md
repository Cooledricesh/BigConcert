# 공통 에러 코드 정의

## 에러 코드 체계

모든 API 응답에서 사용하는 표준화된 에러 코드와 메시지입니다.

### 좌석 선택 관련 (SEAT_*)
| 코드 | 메시지 | HTTP 상태 |
|------|--------|-----------|
| `SEAT_ALREADY_RESERVED` | 선택하신 좌석이 이미 예약되었습니다 | 409 |
| `MAX_SEATS_EXCEEDED` | 최대 4매까지 선택 가능합니다 | 400 |
| `SEAT_UNAVAILABLE` | 선택하신 좌석을 사용할 수 없습니다 | 400 |
| `INVALID_SEAT_SELECTION` | 잘못된 좌석 선택입니다 | 400 |

### 예약 관련 (BOOKING_*)
| 코드 | 메시지 | HTTP 상태 |
|------|--------|-----------|
| `DUPLICATE_BOOKING` | 이미 해당 공연을 예약하셨습니다 | 409 |
| `BOOKING_NOT_FOUND` | 예약 정보를 찾을 수 없습니다 | 404 |
| `TRANSACTION_FAILED` | 예약 처리 중 오류가 발생했습니다 | 500 |

### 콘서트 관련 (CONCERT_*)
| 코드 | 메시지 | HTTP 상태 |
|------|--------|-----------|
| `CONCERT_NOT_FOUND` | 콘서트를 찾을 수 없습니다 | 404 |
| `INVALID_CONCERT_ID` | 잘못된 콘서트 ID 형식입니다 | 400 |

### 인증 관련 (AUTH_*)
| 코드 | 메시지 | HTTP 상태 |
|------|--------|-----------|
| `INVALID_CREDENTIALS` | 전화번호 또는 비밀번호가 일치하지 않습니다 | 401 |
| `TOO_MANY_ATTEMPTS` | 잠시 후 다시 시도해주세요 | 429 |

### 공통 (COMMON_*)
| 코드 | 메시지 | HTTP 상태 |
|------|--------|-----------|
| `VALIDATION_ERROR` | 입력값이 올바르지 않습니다 | 400 |
| `NETWORK_ERROR` | 네트워크 오류가 발생했습니다 | 500 |
| `SESSION_EXPIRED` | 세션이 만료되었습니다 | 401 |
| `DATABASE_ERROR` | 데이터베이스 오류가 발생했습니다 | 500 |

## TypeScript 정의

```typescript
// src/constants/error-codes.ts
export const ERROR_CODES = {
  // 좌석 선택
  SEAT_ALREADY_RESERVED: 'SEAT_ALREADY_RESERVED',
  MAX_SEATS_EXCEEDED: 'MAX_SEATS_EXCEEDED',
  SEAT_UNAVAILABLE: 'SEAT_UNAVAILABLE',
  INVALID_SEAT_SELECTION: 'INVALID_SEAT_SELECTION',

  // 예약
  DUPLICATE_BOOKING: 'DUPLICATE_BOOKING',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',

  // 콘서트
  CONCERT_NOT_FOUND: 'CONCERT_NOT_FOUND',
  INVALID_CONCERT_ID: 'INVALID_CONCERT_ID',

  // 인증
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',

  // 공통
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  DATABASE_ERROR: 'DATABASE_ERROR'
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  SEAT_ALREADY_RESERVED: '선택하신 좌석이 이미 예약되었습니다',
  MAX_SEATS_EXCEEDED: '최대 4매까지 선택 가능합니다',
  SEAT_UNAVAILABLE: '선택하신 좌석을 사용할 수 없습니다',
  INVALID_SEAT_SELECTION: '잘못된 좌석 선택입니다',

  DUPLICATE_BOOKING: '이미 해당 공연을 예약하셨습니다',
  BOOKING_NOT_FOUND: '예약 정보를 찾을 수 없습니다',
  TRANSACTION_FAILED: '예약 처리 중 오류가 발생했습니다',

  CONCERT_NOT_FOUND: '콘서트를 찾을 수 없습니다',
  INVALID_CONCERT_ID: '잘못된 콘서트 ID 형식입니다',

  INVALID_CREDENTIALS: '전화번호 또는 비밀번호가 일치하지 않습니다',
  TOO_MANY_ATTEMPTS: '잠시 후 다시 시도해주세요',

  VALIDATION_ERROR: '입력값이 올바르지 않습니다',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다',
  SESSION_EXPIRED: '세션이 만료되었습니다',
  DATABASE_ERROR: '데이터베이스 오류가 발생했습니다'
};

export const HTTP_STATUS: Record<ErrorCode, number> = {
  SEAT_ALREADY_RESERVED: 409,
  MAX_SEATS_EXCEEDED: 400,
  SEAT_UNAVAILABLE: 400,
  INVALID_SEAT_SELECTION: 400,

  DUPLICATE_BOOKING: 409,
  BOOKING_NOT_FOUND: 404,
  TRANSACTION_FAILED: 500,

  CONCERT_NOT_FOUND: 404,
  INVALID_CONCERT_ID: 400,

  INVALID_CREDENTIALS: 401,
  TOO_MANY_ATTEMPTS: 429,

  VALIDATION_ERROR: 400,
  NETWORK_ERROR: 500,
  SESSION_EXPIRED: 401,
  DATABASE_ERROR: 500
};
```

## 사용 예시

### Backend (Hono)
```typescript
// src/features/booking/backend/error.ts
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from '@/constants/error-codes';

export const createErrorResponse = (code: ErrorCode) => ({
  success: false,
  error: {
    code: ERROR_CODES[code],
    message: ERROR_MESSAGES[code]
  }
});

// 라우터에서 사용
if (seats.some(s => s.status === 'reserved')) {
  return c.json(createErrorResponse('SEAT_ALREADY_RESERVED'), HTTP_STATUS.SEAT_ALREADY_RESERVED);
}
```

### Frontend (React)
```typescript
// src/features/booking/hooks/useBooking.ts
import { ERROR_CODES, ERROR_MESSAGES } from '@/constants/error-codes';

const handleError = (error: any) => {
  if (error.response?.data?.error?.code === ERROR_CODES.DUPLICATE_BOOKING) {
    toast.error(ERROR_MESSAGES.DUPLICATE_BOOKING);
  }
};
```

## 버전 정보
- 작성일: 2025-10-15
- 버전: 1.0.0
- 참조: 각 유스케이스 문서 (001~006)