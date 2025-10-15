# 콘서트 상세 페이지 구현 계획서

## 개요

콘서트 예약 시스템의 콘서트 상세 페이지(`/concerts/[id]`) 구현 계획서입니다.
사용자가 특정 콘서트의 상세 정보와 등급별 잔여 좌석 현황을 확인하고, 예약하기 버튼을 통해 좌석 선택 페이지로 이동할 수 있는 기능을 제공합니다.

### 기능 요약

- **콘서트 기본 정보 조회**: 포스터, 제목, 아티스트, 날짜, 장소, 설명
- **등급별 좌석 현황 시각화**: Special, Premium, Advanced, Regular 등급별 잔여/전체 좌석 수 및 가격
- **예약 가능 여부 판단**: 공연 날짜, 잔여 좌석 기준으로 예약하기 버튼 활성화/비활성화
- **엣지 케이스 처리**: 404, 400, 매진, 공연 종료, 이미지 로딩 실패 등

---

## 모듈 목록

### 백엔드 모듈

| 모듈 | 파일 경로 | 설명 |
|------|----------|------|
| **콘서트 상세 조회 스키마** | `src/features/concerts/backend/schema.ts` | 등급별 좌석 정보 스키마 추가 |
| **콘서트 상세 조회 서비스** | `src/features/concerts/backend/service.ts` | `getConcertById()` 함수 구현 |
| **콘서트 상세 라우터** | `src/features/concerts/backend/route.ts` | `GET /api/concerts/:id` 엔드포인트 추가 |
| **에러 코드** | `src/features/concerts/backend/error.ts` | `CONCERT_NOT_FOUND`, `INVALID_CONCERT_ID` 에러 코드 (이미 존재) |

### 프론트엔드 모듈

| 모듈 | 파일 경로 | 설명 |
|------|----------|------|
| **DTO 재노출** | `src/features/concerts/lib/dto.ts` | `ConcertDetailResponse` 타입 재노출 추가 |
| **React Query Hook** | `src/features/concerts/hooks/useConcertDetail.ts` | 콘서트 상세 조회 훅 |
| **콘서트 상세 헤더 컴포넌트** | `src/features/concerts/components/ConcertDetailHeader.tsx` | 포스터, 제목, 아티스트, 날짜, 장소 표시 |
| **좌석 등급 현황 컴포넌트** | `src/features/concerts/components/SeatGradeAvailability.tsx` | 등급별 잔여 좌석 바 그래프 |
| **예약 버튼 컴포넌트** | `src/features/concerts/components/BookingButton.tsx` | 예약하기 버튼 (조건부 활성화) |
| **콘서트 설명 컴포넌트** | `src/features/concerts/components/ConcertDescription.tsx` | 공연 설명 텍스트 |
| **스켈레톤 UI** | `src/features/concerts/components/ConcertDetailSkeleton.tsx` | 로딩 상태 placeholder |
| **페이지 컴포넌트** | `src/app/concerts/[id]/page.tsx` | 콘서트 상세 페이지 |

### 공통 모듈 (기존 활용)

| 모듈 | 파일 경로 | 설명 |
|------|----------|------|
| **HTTP 응답 패턴** | `src/backend/http/response.ts` | `success`, `failure`, `respond` 헬퍼 |
| **Supabase 클라이언트** | `src/backend/middleware/supabase.ts` | Supabase 서버 클라이언트 |
| **API 클라이언트** | `src/lib/remote/api-client.ts` | Axios 기반 API 클라이언트 |
| **날짜 유틸리티** | 컴포넌트 내 `date-fns` 직접 사용 | MVP에서는 공통 모듈 미추출 |

---

## 아키텍처 다이어그램

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[page.tsx<br>/concerts/[id]] --> B[useConcertDetail Hook]
        B --> C[ConcertDetailHeader]
        B --> D[SeatGradeAvailability]
        B --> E[BookingButton]
        B --> F[ConcertDescription]
        B --> G[ConcertDetailSkeleton]

        C --> H[Image Fallback]
        D --> I[Progress Bar]
        E --> J[Router Push<br>/concerts/[id]/seats]
    end

    subgraph "API Layer"
        B --> K[apiClient.get<br>/api/concerts/:id]
        K --> L[Hono Router<br>GET /api/concerts/:id]
    end

    subgraph "Backend Layer"
        L --> M[getConcertById Service]
        M --> N[Supabase Client]

        N --> O[SELECT concerts<br>WHERE id = :id]
        N --> P[SELECT seats<br>GROUP BY grade]

        M --> Q[Data Validation<br>Zod Schema]
        Q --> R[Response Mapping<br>snake_case → camelCase]
    end

    subgraph "Database Layer"
        O --> S[(concerts table)]
        P --> T[(seats table)]
    end

    R --> L
    L --> K
    K --> B

    style A fill:#e1f5ff
    style B fill:#fff3e0
    style M fill:#f3e5f5
    style S fill:#e8f5e9
    style T fill:#e8f5e9
```

---

## 구현 계획

### Phase 1: 백엔드 API 구현

#### 1.1 스키마 확장 (`schema.ts`)

기존 `ConcertResponse`에 등급별 좌석 정보를 추가한 새로운 스키마를 정의합니다.

```typescript
// src/features/concerts/backend/schema.ts (추가)

// 등급별 좌석 정보 스키마
export const SeatGradeInfoSchema = z.object({
  grade: z.enum(['Special', 'Premium', 'Advanced', 'Regular']),
  price: z.number().int().positive(),
  totalSeats: z.number().int().nonnegative(),
  availableSeats: z.number().int().nonnegative(),
  availabilityRate: z.number().min(0).max(100), // 백분율
});

export type SeatGradeInfo = z.infer<typeof SeatGradeInfoSchema>;

// 콘서트 상세 응답 스키마
export const ConcertDetailResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  artist: z.string(),
  venue: z.string(),
  date: z.string().datetime(),
  posterImage: z.string().nullable(),
  description: z.string().nullable(),
  grades: z.array(SeatGradeInfoSchema),
  totalSeats: z.number().int().nonnegative(),
  totalAvailableSeats: z.number().int().nonnegative(),
});

export type ConcertDetailResponse = z.infer<typeof ConcertDetailResponseSchema>;
```

**주의사항**:
- `grades` 배열은 Special → Regular 순서로 정렬
- `availabilityRate`는 소수점 둘째 자리까지 (예: 41.67)
- 기존 `ConcertResponse`와 별도 타입으로 관리 (목록/상세 응답 구분)

#### 1.2 서비스 로직 구현 (`service.ts`)

`getConcertById()` 함수를 추가하여 콘서트 상세 정보와 등급별 좌석 집계를 수행합니다.

```typescript
// src/features/concerts/backend/service.ts (추가)

export const getConcertById = async (
  client: SupabaseClient,
  concertId: string,
): Promise<HandlerResult<ConcertDetailResponse, ConcertServiceError, unknown>> => {
  // 1. UUID 형식 검증
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(concertId)) {
    return failure(400, concertErrorCodes.notFound, '잘못된 콘서트 ID 형식입니다');
  }

  // 2. 콘서트 기본 정보 조회
  const { data: concert, error: concertError } = await client
    .from(CONCERTS_TABLE)
    .select('*')
    .eq('id', concertId)
    .single();

  if (concertError || !concert) {
    return failure(404, concertErrorCodes.notFound, '콘서트를 찾을 수 없습니다');
  }

  // 3. 등급별 좌석 집계
  const { data: seatsData, error: seatsError } = await client
    .from(SEATS_TABLE)
    .select('grade, price, status')
    .eq('concert_id', concertId);

  if (seatsError) {
    return failure(500, concertErrorCodes.fetchError, seatsError.message);
  }

  // 4. 등급별 집계 계산
  const gradeMap = new Map<string, { price: number; total: number; available: number }>();

  seatsData?.forEach((seat) => {
    const existing = gradeMap.get(seat.grade) || { price: seat.price, total: 0, available: 0 };
    existing.total += 1;
    if (seat.status === 'available') {
      existing.available += 1;
    }
    gradeMap.set(seat.grade, existing);
  });

  // 5. 등급 순서 정렬 및 응답 데이터 생성
  const gradeOrder = ['Special', 'Premium', 'Advanced', 'Regular'];
  const grades: SeatGradeInfo[] = gradeOrder
    .filter((grade) => gradeMap.has(grade))
    .map((grade) => {
      const info = gradeMap.get(grade)!;
      return {
        grade: grade as 'Special' | 'Premium' | 'Advanced' | 'Regular',
        price: info.price,
        totalSeats: info.total,
        availableSeats: info.available,
        availabilityRate: info.total > 0 ? Math.round((info.available / info.total) * 10000) / 100 : 0,
      };
    });

  // 6. 전체 좌석 집계
  const totalSeats = grades.reduce((sum, g) => sum + g.totalSeats, 0);
  const totalAvailableSeats = grades.reduce((sum, g) => sum + g.availableSeats, 0);

  // 7. 응답 데이터 구성
  const response: ConcertDetailResponse = {
    id: concert.id,
    title: concert.title,
    artist: concert.artist,
    venue: concert.venue,
    date: new Date(concert.date).toISOString(),
    posterImage: concert.poster_image ?? fallbackPosterImage(concert.id),
    description: concert.description,
    grades,
    totalSeats,
    totalAvailableSeats,
  };

  // 8. 응답 검증
  const parsed = ConcertDetailResponseSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      concertErrorCodes.validationError,
      'Concert detail response failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};
```

**주의사항**:
- UUID 형식 검증 먼저 수행 (400 에러)
- `.single()` 사용으로 단일 레코드 조회
- 등급이 존재하지 않을 경우 빈 배열 허용
- `availabilityRate` 계산 시 소수점 둘째 자리까지 반올림

#### 1.3 라우터 확장 (`route.ts`)

기존 `GET /api/concerts` 엔드포인트 옆에 `GET /api/concerts/:id` 추가합니다.

```typescript
// src/features/concerts/backend/route.ts (추가)

export const registerConcertsRoutes = (app: Hono<AppEnv>) => {
  // 기존: GET /api/concerts
  app.get('/api/concerts', async (c) => {
    // ... 기존 코드
  });

  // 추가: GET /api/concerts/:id
  app.get('/api/concerts/:id', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const concertId = c.req.param('id');

    const result = await getConcertById(supabase, concertId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ConcertServiceError, unknown>;

      if (errorResult.error.code === concertErrorCodes.notFound) {
        logger.warn('Concert not found', { concertId });
      } else if (errorResult.error.code === concertErrorCodes.fetchError) {
        logger.error('Failed to fetch concert detail', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};
```

**주의사항**:
- `c.req.param('id')`로 URL 파라미터 추출
- 에러 타입별로 적절한 로그 레벨 사용 (warn vs error)
- 기존 라우터와 동일한 `respond` 패턴 사용

#### 1.4 에러 코드 확인

기존 `error.ts`에 이미 정의된 에러 코드를 활용합니다.

```typescript
// src/features/concerts/backend/error.ts (기존)
export const concertErrorCodes = {
  notFound: 'CONCERT_NOT_FOUND',          // 404: 콘서트 미존재, 잘못된 ID
  fetchError: 'CONCERT_FETCH_ERROR',       // 500: Supabase 쿼리 실패
  validationError: 'CONCERT_VALIDATION_ERROR', // 500: 응답 검증 실패
  invalidDateFormat: 'CONCERT_INVALID_DATE_FORMAT', // (미사용)
} as const;
```

**확인 사항**:
- `notFound`는 404와 400 모두에서 사용 (서비스 로직에서 구분)
- 필요시 `invalidId: 'CONCERT_INVALID_ID'` 추가 고려 (현재는 `notFound` 재사용)

---

### Phase 2: 프론트엔드 구현

#### 2.1 DTO 재노출 (`lib/dto.ts`)

새로운 `ConcertDetailResponse` 타입을 재노출합니다.

```typescript
// src/features/concerts/lib/dto.ts (추가)
export type {
  ConcertResponse,
  ConcertListResponse,
  ConcertDetailResponse,  // 추가
  SeatGradeInfo,          // 추가
} from '@/features/concerts/backend/schema';

export {
  ConcertResponseSchema,
  ConcertListResponseSchema,
  ConcertDetailResponseSchema,  // 추가
  SeatGradeInfoSchema,           // 추가
} from '@/features/concerts/backend/schema';
```

#### 2.2 React Query Hook (`hooks/useConcertDetail.ts`)

콘서트 ID를 받아 상세 정보를 조회하는 훅을 생성합니다.

```typescript
// src/features/concerts/hooks/useConcertDetail.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import {
  ConcertDetailResponseSchema,
  type ConcertDetailResponse,
} from '../lib/dto';

export const useConcertDetail = (concertId: string) => {
  return useQuery<ConcertDetailResponse>({
    queryKey: ['concerts', concertId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/concerts/${concertId}`);
      return ConcertDetailResponseSchema.parse(response.data);
    },
    staleTime: 30 * 1000, // 30초
    gcTime: 5 * 60 * 1000, // 5분
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      // 404는 재시도 안 함
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
};
```

**주의사항**:
- `queryKey`에 `concertId` 포함하여 캐싱 세분화
- `staleTime: 30초`로 좌석 현황 갱신 주기 설정
- 404 에러는 재시도하지 않음 (존재하지 않는 콘서트)

#### 2.3 컴포넌트 구현

##### ConcertDetailHeader 컴포넌트

```typescript
// src/features/concerts/components/ConcertDetailHeader.tsx
'use client';

import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, MapPin, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ConcertDetailHeaderProps {
  title: string;
  artist: string;
  venue: string;
  date: string;
  posterImage: string | null;
}

export function ConcertDetailHeader({
  title,
  artist,
  venue,
  date,
  posterImage,
}: ConcertDetailHeaderProps) {
  const formattedDate = format(
    parseISO(date),
    'yyyy년 M월 d일 (EEE) a h시 mm분',
    { locale: ko }
  );

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 포스터 이미지 */}
        <div className="md:col-span-1">
          <div className="relative aspect-[2/3] w-full">
            <Image
              src={posterImage || 'https://picsum.photos/400/600'}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              priority
            />
          </div>
        </div>

        {/* 콘서트 정보 */}
        <CardContent className="md:col-span-2 p-6 space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-5 w-5" />
              <p className="text-lg">{artist}</p>
            </div>
          </div>

          <div className="space-y-3 text-base">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <p className="font-medium">공연 일시</p>
                <p className="text-muted-foreground">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <p className="font-medium">공연 장소</p>
                <p className="text-muted-foreground">{venue}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
```

**필요한 shadcn-ui 컴포넌트**:
```bash
npx shadcn@latest add card
```

##### SeatGradeAvailability 컴포넌트

```typescript
// src/features/concerts/components/SeatGradeAvailability.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SeatGradeInfo } from '../lib/dto';

interface SeatGradeAvailabilityProps {
  grades: SeatGradeInfo[];
}

const gradeColors = {
  Special: 'bg-purple-500',
  Premium: 'bg-blue-500',
  Advanced: 'bg-green-500',
  Regular: 'bg-gray-500',
} as const;

const gradeLabels = {
  Special: 'Special (1-3열)',
  Premium: 'Premium (4-7열)',
  Advanced: 'Advanced (8-15열)',
  Regular: 'Regular (16-20열)',
} as const;

export function SeatGradeAvailability({ grades }: SeatGradeAvailabilityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>등급별 좌석 현황</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {grades.map((grade) => {
          const isSoldOut = grade.availableSeats === 0;
          const colorClass = isSoldOut ? 'bg-gray-300' : gradeColors[grade.grade];

          return (
            <div key={grade.grade} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{gradeLabels[grade.grade]}</span>
                  {isSoldOut && (
                    <Badge variant="destructive" className="text-xs">
                      매진
                    </Badge>
                  )}
                </div>
                <span className="font-bold text-lg">
                  {grade.price.toLocaleString()}원
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* 진행 바 */}
                <div className="flex-1 bg-secondary rounded-full h-3 overflow-hidden">
                  <div
                    className={`${colorClass} h-full transition-all duration-300`}
                    style={{ width: `${grade.availabilityRate}%` }}
                  />
                </div>

                {/* 좌석 수 */}
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {grade.availableSeats} / {grade.totalSeats}석
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                잔여율: {grade.availabilityRate.toFixed(1)}%
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
```

**필요한 shadcn-ui 컴포넌트**:
```bash
npx shadcn@latest add badge
```

##### ConcertDescription 컴포넌트

```typescript
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
```

##### BookingButton 컴포넌트

```typescript
// src/features/concerts/components/BookingButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { parseISO, isBefore } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface BookingButtonProps {
  concertId: string;
  date: string;
  totalAvailableSeats: number;
}

export function BookingButton({
  concertId,
  date,
  totalAvailableSeats,
}: BookingButtonProps) {
  const router = useRouter();

  const concertDate = parseISO(date);
  const isExpired = isBefore(concertDate, new Date());
  const isSoldOut = totalAvailableSeats === 0;

  const canBook = !isExpired && !isSoldOut;

  const handleBooking = () => {
    if (canBook) {
      router.push(`/concerts/${concertId}/seats`);
    }
  };

  return (
    <div className="space-y-4">
      {/* 경고 메시지 */}
      {isExpired && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>이미 종료된 공연입니다.</AlertDescription>
        </Alert>
      )}

      {isSoldOut && !isExpired && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>모든 좌석이 매진되었습니다.</AlertDescription>
        </Alert>
      )}

      {/* 예약하기 버튼 */}
      <Button
        onClick={handleBooking}
        disabled={!canBook}
        size="lg"
        className="w-full"
      >
        {isExpired
          ? '공연 종료'
          : isSoldOut
          ? '매진'
          : `예약하기 (잔여 ${totalAvailableSeats}석)`}
      </Button>

      {canBook && (
        <p className="text-sm text-center text-muted-foreground">
          좌석 선택 페이지로 이동합니다
        </p>
      )}
    </div>
  );
}
```

**필요한 shadcn-ui 컴포넌트**:
```bash
npx shadcn@latest add button
npx shadcn@latest add alert
```

##### ConcertDetailSkeleton 컴포넌트

```typescript
// src/features/concerts/components/ConcertDetailSkeleton.tsx
'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ConcertDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* 헤더 스켈레톤 */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Skeleton className="aspect-[2/3] w-full" />
          </div>
          <CardContent className="md:col-span-2 p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </CardContent>
        </div>
      </Card>

      {/* 좌석 현황 스켈레톤 */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 버튼 스켈레톤 */}
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
```

**필요한 shadcn-ui 컴포넌트**:
```bash
npx shadcn@latest add skeleton
```

#### 2.4 페이지 컴포넌트 (`src/app/concerts/[id]/page.tsx`)

```typescript
// src/app/concerts/[id]/page.tsx
'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useConcertDetail } from '@/features/concerts/hooks/useConcertDetail';
import { ConcertDetailHeader } from '@/features/concerts/components/ConcertDetailHeader';
import { SeatGradeAvailability } from '@/features/concerts/components/SeatGradeAvailability';
import { ConcertDescription } from '@/features/concerts/components/ConcertDescription';
import { BookingButton } from '@/features/concerts/components/BookingButton';
import { ConcertDetailSkeleton } from '@/features/concerts/components/ConcertDetailSkeleton';

export default function ConcertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: concert, isLoading, error } = useConcertDetail(id);

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Ticket className="h-6 w-6" />
            <h1 className="text-2xl font-bold">BigConcert</h1>
          </Link>

          <Link href="/bookings">
            <Button variant="outline">예약 조회</Button>
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 뒤로가기 버튼 */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Button>

          {/* 로딩 상태 */}
          {isLoading && <ConcertDetailSkeleton />}

          {/* 에러 상태 */}
          {error && (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>콘서트를 불러올 수 없습니다</AlertTitle>
                <AlertDescription>
                  {(error as any)?.response?.status === 404
                    ? '존재하지 않는 콘서트입니다.'
                    : '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/')}>
                  홈으로
                </Button>
              </div>
            </div>
          )}

          {/* 정상 상태 */}
          {concert && (
            <>
              {/* 콘서트 헤더 */}
              <ConcertDetailHeader
                title={concert.title}
                artist={concert.artist}
                venue={concert.venue}
                date={concert.date}
                posterImage={concert.posterImage}
              />

              {/* 좌석 현황 */}
              <SeatGradeAvailability grades={concert.grades} />

              {/* 공연 설명 */}
              <ConcertDescription description={concert.description} />

              {/* 예약하기 버튼 */}
              <BookingButton
                concertId={concert.id}
                date={concert.date}
                totalAvailableSeats={concert.totalAvailableSeats}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
```

**주의사항**:
- `use(params)` 사용하여 Promise unwrap (Next.js 15+)
- `router.back()` 대신 `router.push('/')` 사용 고려 (히스토리 없을 경우)
- 404 에러와 네트워크 에러를 구분하여 메시지 표시
- 최대 너비 `max-w-4xl`로 가독성 향상

---

### Phase 3: 테스트 및 검증

#### 3.1 백엔드 API 테스트

**수동 테스트 체크리스트**:

- [ ] **정상 케이스**
  ```bash
  curl http://localhost:3000/api/concerts/{valid-uuid}
  ```
  - 200 OK 응답
  - 응답 형식이 `ConcertDetailResponseSchema`와 일치
  - `grades` 배열이 Special → Regular 순서로 정렬
  - `availabilityRate` 계산 정확성 확인

- [ ] **존재하지 않는 콘서트 ID**
  ```bash
  curl http://localhost:3000/api/concerts/{invalid-uuid}
  ```
  - 404 Not Found 응답
  - 에러 코드: `CONCERT_NOT_FOUND`

- [ ] **잘못된 ID 형식**
  ```bash
  curl http://localhost:3000/api/concerts/abc123
  ```
  - 400 Bad Request 응답
  - 에러 코드: `CONCERT_NOT_FOUND`

- [ ] **등급별 집계 정확성**
  - Supabase 대시보드에서 직접 쿼리 결과와 비교
  ```sql
  SELECT grade, price, COUNT(*) as total,
         COUNT(CASE WHEN status = 'available' THEN 1 END) as available
  FROM seats
  WHERE concert_id = '{concert-id}'
  GROUP BY grade, price
  ORDER BY CASE grade
    WHEN 'Special' THEN 1
    WHEN 'Premium' THEN 2
    WHEN 'Advanced' THEN 3
    WHEN 'Regular' THEN 4
  END;
  ```

- [ ] **전체 좌석 집계 정확성**
  - `totalSeats`와 `totalAvailableSeats` 값이 각 등급 합계와 일치

#### 3.2 프론트엔드 UI/UX 테스트

**수동 테스트 체크리스트**:

- [ ] **로딩 상태**
  - 페이지 접속 시 스켈레톤 UI 표시
  - Network Throttling (Slow 3G)로 로딩 상태 확인

- [ ] **정상 상태**
  - 포스터 이미지 정상 표시
  - 제목, 아티스트, 날짜, 장소 렌더링
  - 날짜 포맷: "2025년 12월 31일 (화) 오후 7시 00분"
  - 등급별 좌석 바 그래프 시각화 (색상 구분)
  - 가격 포맷: "250,000원" (천 단위 구분)
  - 잔여율 표시: "41.7%"
  - 공연 설명 표시 (null이면 미표시)
  - 예약하기 버튼 활성화 (조건: 미래 공연 + 잔여 좌석 > 0)

- [ ] **404 에러**
  - 존재하지 않는 ID로 접근 시 "존재하지 않는 콘서트입니다" 메시지
  - "홈으로" 버튼 클릭 시 `/`로 이동

- [ ] **네트워크 에러**
  - 네트워크 오프라인으로 설정 시 에러 메시지
  - 재시도 후 정상 표시

- [ ] **공연 종료 상태**
  - 과거 날짜의 콘서트 조회 시
  - "이미 종료된 공연입니다" 경고 메시지
  - 예약하기 버튼 비활성화 ("공연 종료")

- [ ] **전체 매진 상태**
  - `totalAvailableSeats === 0`인 경우
  - "모든 좌석이 매진되었습니다" 경고 메시지
  - 예약하기 버튼 비활성화 ("매진")
  - 등급별 바 그래프 회색 처리
  - 각 등급에 "매진" 배지 표시

- [ ] **일부 등급 매진**
  - 특정 등급만 `availableSeats === 0`
  - 해당 등급만 회색 바 그래프 + "매진" 배지
  - 다른 등급은 정상 표시
  - 예약하기 버튼은 활성화 유지

- [ ] **이미지 로딩 실패**
  - 잘못된 이미지 URL로 변경
  - fallback 이미지 표시 확인

- [ ] **반응형 디자인**
  - 모바일 (< 768px): 포스터와 정보 세로 배치
  - 데스크톱 (>= 768px): 포스터와 정보 가로 배치 (3:2 비율)
  - 최대 너비 `max-w-4xl` 적용 확인

- [ ] **예약하기 버튼 클릭**
  - 활성화 상태에서 클릭 시 `/concerts/{id}/seats`로 이동
  - 비활성화 상태에서 클릭 불가

- [ ] **뒤로가기 버튼**
  - "목록으로" 버튼 클릭 시 이전 페이지로 복귀
  - 히스토리가 없을 경우 `/`로 이동

#### 3.3 성능 및 캐싱 확인

**체크리스트**:

- [ ] **React Query 캐싱**
  - 동일 콘서트 재방문 시 캐시 데이터 사용 (30초 이내)
  - React Query DevTools에서 `['concerts', id]` 쿼리 상태 확인
  - 30초 경과 후 자동 갱신 (staleTime)

- [ ] **이미지 최적화**
  - Next.js `<Image>` 컴포넌트 사용
  - `priority` prop으로 LCP 최적화
  - `sizes` prop으로 반응형 이미지 최적화

- [ ] **렌더링 최적화**
  - 불필요한 리렌더링 없음 (React DevTools Profiler 확인)
  - 필요시 컴포넌트에 `React.memo` 적용

- [ ] **Lighthouse 성능 측정**
  - Performance: 90+ 목표
  - Accessibility: 95+ 목표
  - Best Practices: 95+ 목표
  - SEO: 80+ 목표 (동적 페이지)

---

## QA Sheet (Presentation Layer)

### 콘서트 상세 페이지 (`/concerts/[id]/page.tsx`)

| Test Case ID | 시나리오 | 입력 | 예상 출력 | 실제 출력 | 상태 |
|--------------|---------|------|----------|----------|------|
| **CD-001** | 정상 조회 | 유효한 concert ID | 콘서트 상세 정보, 등급별 좌석 현황, 예약하기 버튼 활성화 | | [ ] |
| **CD-002** | 존재하지 않는 ID | 잘못된 UUID | 404 에러 메시지, "홈으로" 버튼 | | [ ] |
| **CD-003** | 잘못된 ID 형식 | 'abc123' | 404 에러 메시지 | | [ ] |
| **CD-004** | 공연 종료 | 과거 날짜 콘서트 | "이미 종료된 공연입니다" 경고, 버튼 비활성화 | | [ ] |
| **CD-005** | 전체 매진 | availableSeats === 0 | "모든 좌석이 매진되었습니다" 경고, 버튼 비활성화 | | [ ] |
| **CD-006** | 일부 등급 매진 | Special 등급만 매진 | Special 등급에 "매진" 배지, 버튼은 활성화 | | [ ] |
| **CD-007** | 이미지 로딩 실패 | 잘못된 poster_image URL | fallback 이미지 표시 | | [ ] |
| **CD-008** | 네트워크 오류 | 오프라인 상태 | 에러 메시지, 재시도 버튼 | | [ ] |
| **CD-009** | 로딩 상태 | 느린 네트워크 | 스켈레톤 UI 표시 | | [ ] |
| **CD-010** | 예약하기 클릭 | 정상 상태에서 버튼 클릭 | `/concerts/{id}/seats`로 이동 | | [ ] |
| **CD-011** | 뒤로가기 클릭 | "목록으로" 버튼 클릭 | 이전 페이지 또는 `/`로 이동 | | [ ] |
| **CD-012** | 반응형 레이아웃 (모바일) | < 768px 화면 | 포스터와 정보 세로 배치 | | [ ] |
| **CD-013** | 반응형 레이아웃 (데스크톱) | >= 768px 화면 | 포스터와 정보 가로 배치 (1:2) | | [ ] |

### 등급별 좌석 현황 컴포넌트 (`SeatGradeAvailability`)

| Test Case ID | 시나리오 | 입력 | 예상 출력 | 실제 출력 | 상태 |
|--------------|---------|------|----------|----------|------|
| **SGA-001** | 정상 표시 | 4개 등급 데이터 | Special → Regular 순서로 표시 | | [ ] |
| **SGA-002** | 등급별 색상 | 각 등급 | Special: 보라색, Premium: 파란색, Advanced: 초록색, Regular: 회색 | | [ ] |
| **SGA-003** | 매진 등급 | availableSeats === 0 | 회색 바 + "매진" 배지 | | [ ] |
| **SGA-004** | 잔여율 표시 | availableSeats: 10, totalSeats: 48 | "잔여율: 20.8%" | | [ ] |
| **SGA-005** | 가격 포맷 | price: 250000 | "250,000원" | | [ ] |

### 예약하기 버튼 컴포넌트 (`BookingButton`)

| Test Case ID | 시나리오 | 입력 | 예상 출력 | 실제 출력 | 상태 |
|--------------|---------|------|----------|----------|------|
| **BB-001** | 정상 상태 | 미래 공연 + 잔여 좌석 > 0 | 버튼 활성화, "예약하기 (잔여 N석)" | | [ ] |
| **BB-002** | 공연 종료 | 과거 날짜 | 버튼 비활성화, "공연 종료" | | [ ] |
| **BB-003** | 매진 | availableSeats === 0 | 버튼 비활성화, "매진" | | [ ] |
| **BB-004** | 클릭 동작 | 활성화 상태 클릭 | `/concerts/{id}/seats`로 라우팅 | | [ ] |

---

## Unit Test (Business Logic)

### 백엔드 서비스 (`getConcertById`)

```typescript
// src/features/concerts/backend/service.test.ts (예시)

describe('getConcertById', () => {
  it('유효한 ID로 콘서트 상세 조회 성공', async () => {
    // Given: 유효한 UUID
    const concertId = 'valid-uuid';
    const mockClient = createMockSupabaseClient({
      concert: { id: concertId, title: 'Test Concert' },
      seats: [
        { grade: 'Special', price: 250000, status: 'available' },
        { grade: 'Special', price: 250000, status: 'reserved' },
      ],
    });

    // When: getConcertById 호출
    const result = await getConcertById(mockClient, concertId);

    // Then: 성공 응답
    expect(result.ok).toBe(true);
    expect(result.data.id).toBe(concertId);
    expect(result.data.grades).toHaveLength(1);
    expect(result.data.grades[0].availableSeats).toBe(1);
  });

  it('잘못된 UUID 형식으로 400 에러 반환', async () => {
    // Given: 잘못된 ID
    const invalidId = 'abc123';
    const mockClient = createMockSupabaseClient({});

    // When: getConcertById 호출
    const result = await getConcertById(mockClient, invalidId);

    // Then: 400 에러
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error.code).toBe('CONCERT_NOT_FOUND');
  });

  it('존재하지 않는 ID로 404 에러 반환', async () => {
    // Given: 존재하지 않는 UUID
    const nonExistentId = 'valid-uuid-but-not-found';
    const mockClient = createMockSupabaseClient({ concert: null });

    // When: getConcertById 호출
    const result = await getConcertById(mockClient, nonExistentId);

    // Then: 404 에러
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(result.error.code).toBe('CONCERT_NOT_FOUND');
  });

  it('등급별 좌석 집계 정확성', async () => {
    // Given: 여러 등급의 좌석
    const seats = [
      { grade: 'Special', price: 250000, status: 'available' }, // 1/3
      { grade: 'Special', price: 250000, status: 'reserved' },
      { grade: 'Special', price: 250000, status: 'reserved' },
      { grade: 'Premium', price: 190000, status: 'available' }, // 2/2
      { grade: 'Premium', price: 190000, status: 'available' },
    ];
    const mockClient = createMockSupabaseClient({ seats });

    // When: getConcertById 호출
    const result = await getConcertById(mockClient, 'test-id');

    // Then: 등급별 집계 정확
    expect(result.data.grades[0].grade).toBe('Special');
    expect(result.data.grades[0].totalSeats).toBe(3);
    expect(result.data.grades[0].availableSeats).toBe(1);
    expect(result.data.grades[0].availabilityRate).toBeCloseTo(33.33, 1);

    expect(result.data.grades[1].grade).toBe('Premium');
    expect(result.data.grades[1].totalSeats).toBe(2);
    expect(result.data.grades[1].availableSeats).toBe(2);
    expect(result.data.grades[1].availabilityRate).toBe(100);
  });

  it('등급 정렬 순서 확인 (Special → Regular)', async () => {
    // Given: 역순으로 저장된 좌석
    const seats = [
      { grade: 'Regular', price: 140000, status: 'available' },
      { grade: 'Advanced', price: 170000, status: 'available' },
      { grade: 'Premium', price: 190000, status: 'available' },
      { grade: 'Special', price: 250000, status: 'available' },
    ];
    const mockClient = createMockSupabaseClient({ seats });

    // When: getConcertById 호출
    const result = await getConcertById(mockClient, 'test-id');

    // Then: 정렬된 순서
    expect(result.data.grades[0].grade).toBe('Special');
    expect(result.data.grades[1].grade).toBe('Premium');
    expect(result.data.grades[2].grade).toBe('Advanced');
    expect(result.data.grades[3].grade).toBe('Regular');
  });
});
```

---

## 구현 순서 및 체크리스트

### Step 1: 백엔드 구현 (예상 시간: 2-3시간)

- [ ] `src/features/concerts/backend/schema.ts` 확장
  - [ ] `SeatGradeInfoSchema` 추가
  - [ ] `ConcertDetailResponseSchema` 추가

- [ ] `src/features/concerts/backend/service.ts` 확장
  - [ ] `getConcertById()` 함수 구현
  - [ ] UUID 검증 로직
  - [ ] 등급별 좌석 집계 로직
  - [ ] 정렬 및 응답 변환

- [ ] `src/features/concerts/backend/route.ts` 확장
  - [ ] `GET /api/concerts/:id` 엔드포인트 추가
  - [ ] 에러 핸들링 및 로깅

- [ ] 백엔드 API 테스트
  - [ ] 브라우저에서 직접 호출 (`http://localhost:3000/api/concerts/{id}`)
  - [ ] 정상 케이스, 404, 400 확인

### Step 2: 프론트엔드 구현 (예상 시간: 4-5시간)

- [ ] `src/features/concerts/lib/dto.ts` 확장
  - [ ] `ConcertDetailResponse`, `SeatGradeInfo` 재노출

- [ ] `src/features/concerts/hooks/useConcertDetail.ts` 생성
  - [ ] React Query hook 구현
  - [ ] 에러 처리 및 재시도 로직

- [ ] 컴포넌트 구현
  - [ ] `ConcertDetailHeader.tsx`
  - [ ] `SeatGradeAvailability.tsx`
  - [ ] `ConcertDescription.tsx`
  - [ ] `BookingButton.tsx`
  - [ ] `ConcertDetailSkeleton.tsx`

- [ ] `src/app/concerts/[id]/page.tsx` 생성
  - [ ] 페이지 레이아웃 구성
  - [ ] 로딩/에러/정상 상태 처리
  - [ ] 헤더 및 네비게이션

### Step 3: shadcn-ui 컴포넌트 설치 (예상 시간: 5분)

```bash
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add skeleton
npx shadcn@latest add button
npx shadcn@latest add alert
```

### Step 4: 테스트 및 검증 (예상 시간: 1-2시간)

- [ ] 백엔드 API 테스트 (3.1 참조)
- [ ] 프론트엔드 UI/UX 테스트 (3.2 참조)
- [ ] 성능 및 캐싱 확인 (3.3 참조)
- [ ] QA Sheet 작성 및 검증
- [ ] Lighthouse 성능 측정

**총 예상 시간**: 7-10.5시간

---

## 위험 요소 및 대응 방안

### 1. 등급별 집계 쿼리 성능

**위험**: 좌석 수가 많을 경우 (320석) 집계 쿼리 성능 저하

**대응 방안**:
- 현재: 인덱스 `idx_seats_concert_grade` 활용
- MVP: 단일 콘서트 조회이므로 성능 문제 없음 (320석)
- 향후: Supabase View 또는 Materialized View로 사전 집계
- 필요시: Redis 캐싱 도입 (등급별 좌석 현황)

### 2. 좌석 현황 실시간성

**위험**: 상세 페이지의 좌석 현황이 실제와 다를 수 있음

**대응 방안**:
- `staleTime: 30초`로 자주 갱신
- 좌석 선택 페이지 진입 시 최신 정보 재확인
- 사용자에게 "잔여 좌석은 실시간 정보가 아닙니다" 안내 (필요시)
- 향후: WebSocket으로 실시간 업데이트

### 3. 공연 날짜 시간대 처리

**위험**: 서버/클라이언트 시간대 불일치로 인한 "공연 종료" 판단 오류

**대응 방안**:
- 백엔드: ISO 8601 형식으로 응답 (UTC)
- 프론트엔드: `date-fns`의 `parseISO`로 사용자 로컬 시간대로 변환
- 서버 환경 변수: `TZ=Asia/Seoul` 설정
- 테스트: 다양한 시간대에서 검증

### 4. 이미지 로딩 실패

**위험**: 외부 이미지 URL 접근 불가 시 UI 깨짐

**대응 방안**:
- 백엔드: `poster_image` NULL 시 fallback URL 반환
- 프론트엔드: `Next/Image`의 자동 에러 처리 + fallback
- 개발 중: picsum.photos placeholder 사용
- 운영: CDN 기반 이미지 서버 구축 권장

### 5. 404 페이지 처리

**위험**: 존재하지 않는 콘서트 ID 접근 시 사용자 경험 저하

**대응 방안**:
- 명확한 에러 메시지 표시
- "홈으로" 버튼으로 빠른 복귀 유도
- 필요시 유사 콘서트 추천 (향후 확장)

---

## 다음 단계

이 콘서트 상세 페이지 구현 완료 후 다음 페이지로 진행:

1. **좌석 선택 페이지** (`/concerts/[id]/seats`)
   - 참조: `docs/003/spec.md`
   - 백엔드: `GET /api/concerts/:id/seats`
   - 프론트엔드: 좌석 배치도, Context API 상태 관리

2. **예약 정보 입력 페이지** (`/concerts/[id]/booking`)
   - 참조: `docs/004/spec.md`
   - 백엔드: `POST /api/bookings`
   - 프론트엔드: react-hook-form + zod 검증

---

## 참고 문서

- **[PRD](../prd.md)**: 제품 요구사항 정의서
- **[콘서트 상세 정보 조회 스펙](./spec.md)**: 유스케이스 상세 명세
- **[데이터베이스 스키마](../database.md)**: 테이블 구조
- **[에러 코드](../error-codes.md)**: 표준 에러 코드 정의
- **[홈 페이지 구현 계획](../page_home/plan.md)**: 콘서트 목록 참조
- **[기존 concerts feature](../../src/features/concerts/)**: 목록 조회 구현 참조

---

## 버전 정보

- **작성일**: 2025-10-15
- **버전**: 1.0.0
- **작성자**: Claude Code
- **기반 문서**: PRD v1.0, Userflow v1.1.0, spec.md v1.0.0
