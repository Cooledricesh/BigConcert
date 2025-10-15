# 데이터 검증 스키마 정의

## 개요

프론트엔드와 백엔드에서 공통으로 사용하는 데이터 검증 스키마를 정의합니다.
Zod를 사용하여 타입 안전성과 런타임 검증을 동시에 보장합니다.

## 공통 검증 스키마

### 예약 정보 입력
```typescript
// src/features/booking/lib/validation.ts
import { z } from 'zod';

// 전화번호 정규식: 010-XXXX-XXXX 형식 (하이픈 제거 후 검증)
const phoneRegex = /^01[0-9]{8,9}$/;

// 예약 폼 검증 스키마
export const BookingFormSchema = z.object({
  userName: z.string()
    .trim()
    .min(2, '이름은 2자 이상 입력해주세요')
    .max(50, '이름은 50자 이하로 입력해주세요'),

  userPhone: z.string()
    .transform(val => val.replace(/-/g, '')) // 하이픈 자동 제거
    .regex(phoneRegex, '올바른 전화번호 형식이 아닙니다'),

  password: z.string()
    .regex(/^\d{4}$/, '비밀번호는 4자리 숫자입니다')
});

export type BookingFormData = z.infer<typeof BookingFormSchema>;
```

### 예약 조회
```typescript
// src/features/booking/lib/validation.ts

export const BookingSearchSchema = z.object({
  userPhone: z.string()
    .transform(val => val.replace(/-/g, ''))
    .regex(phoneRegex, '올바른 전화번호 형식이 아닙니다'),

  password: z.string()
    .regex(/^\d{4}$/, '비밀번호는 4자리 숫자입니다')
});

export type BookingSearchData = z.infer<typeof BookingSearchSchema>;
```

### 좌석 선택
```typescript
// src/features/seats/lib/validation.ts

export const SeatSelectionSchema = z.object({
  concertId: z.string().uuid('올바른 콘서트 ID가 아닙니다'),
  seatIds: z.array(z.string().uuid())
    .min(1, '최소 1개 이상의 좌석을 선택해주세요')
    .max(4, '최대 4개까지 선택 가능합니다')
});

export type SeatSelectionData = z.infer<typeof SeatSelectionSchema>;
```

## 프론트엔드 사용법

### React Hook Form 통합
```typescript
// src/features/booking/components/BookingForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookingFormSchema, BookingFormData } from '../lib/validation';

export function BookingForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<BookingFormData>({
    resolver: zodResolver(BookingFormSchema)
  });

  const onSubmit = async (data: BookingFormData) => {
    // API 호출
    const response = await apiClient.post('/api/bookings', {
      ...data,
      concertId,
      seatIds
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('userName')}
        placeholder="예약자명"
      />
      {errors.userName && (
        <span>{errors.userName.message}</span>
      )}

      <input
        {...register('userPhone')}
        placeholder="전화번호"
        type="tel"
      />
      {errors.userPhone && (
        <span>{errors.userPhone.message}</span>
      )}

      <input
        {...register('password')}
        placeholder="비밀번호 4자리"
        type="password"
        maxLength={4}
      />
      {errors.password && (
        <span>{errors.password.message}</span>
      )}

      <button type="submit">예약하기</button>
    </form>
  );
}
```

## 백엔드 사용법

### Hono 라우터 검증
```typescript
// src/features/booking/backend/schema.ts
import { z } from 'zod';

// 백엔드 요청 스키마 (프론트엔드와 동일한 검증 재사용)
export const CreateBookingSchema = z.object({
  concertId: z.string().uuid(),
  seatIds: z.array(z.string().uuid()).min(1).max(4),
  userName: z.string().trim().min(2).max(50),
  userPhone: z.string().regex(/^01[0-9]{8,9}$/),
  password: z.string().regex(/^\d{4}$/)
});

export const BookingSearchSchema = z.object({
  userPhone: z.string().regex(/^01[0-9]{8,9}$/),
  password: z.string().regex(/^\d{4}$/)
});
```

```typescript
// src/features/booking/backend/route.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateBookingSchema, BookingSearchSchema } from './schema';
import { createBooking, searchBookings } from './service';

const app = new Hono();

// 예약 생성
app.post('/api/bookings',
  zValidator('json', CreateBookingSchema),
  async (c) => {
    const data = c.req.valid('json');
    const supabase = c.get('supabase');
    const result = await createBooking(supabase, data);
    return respond(result);
  }
);

// 예약 조회
app.post('/api/bookings/search',
  zValidator('json', BookingSearchSchema),
  async (c) => {
    const data = c.req.valid('json');
    const supabase = c.get('supabase');
    const result = await searchBookings(supabase, data);
    return respond(result);
  }
);
```

## 검증 에러 처리

### 프론트엔드
```typescript
// React Hook Form이 자동으로 처리
// errors 객체를 통해 각 필드의 에러 메시지 표시
```

### 백엔드
```typescript
// zValidator가 자동으로 400 Bad Request 응답 생성
// 검증 실패 시 다음과 같은 응답:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값이 올바르지 않습니다",
    "issues": [
      {
        "path": ["userPhone"],
        "message": "올바른 전화번호 형식이 아닙니다"
      }
    ]
  }
}
```

## 유효성 규칙 요약

| 필드 | 규칙 | 에러 메시지 |
|------|------|------------|
| `userName` | 2-50자, 공백 제거 | 이름은 2자 이상 50자 이하로 입력해주세요 |
| `userPhone` | 10-11자리 숫자 | 올바른 전화번호 형식이 아닙니다 |
| `password` | 4자리 숫자 | 비밀번호는 4자리 숫자입니다 |
| `seatIds` | 1-4개 UUID 배열 | 최소 1개, 최대 4개까지 선택 가능합니다 |
| `concertId` | UUID 형식 | 올바른 콘서트 ID가 아닙니다 |

## 주의사항

1. **일관성**: 프론트엔드와 백엔드가 동일한 검증 규칙 사용
2. **이중 검증**: 클라이언트 검증은 UX용, 서버 검증은 보안용
3. **변환 처리**: 전화번호 하이픈 자동 제거 등 transform 활용
4. **메시지 한글화**: 모든 에러 메시지는 한글로 제공

## 버전 정보
- 작성일: 2025-10-15
- 버전: 1.0.0
- 참조: 004/spec.md, 005/spec.md