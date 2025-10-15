# 홈 페이지 (콘서트 목록) 개발 계획

## 개요
콘서트 예약 시스템의 메인 홈페이지(`/`) 구현 계획서입니다.
사용자가 예약 가능한 콘서트 목록을 조회하고, 선택하여 상세 페이지로 이동할 수 있는 기능을 제공합니다.

## 현재 상태 분석

### 기존 코드베이스 구조
- ✅ **데이터베이스**: 테이블 및 샘플 데이터 이미 구축됨
  - `concerts` 테이블: 콘서트 기본 정보 (`0002_create_concerts_table.sql`)
  - `seats` 테이블: 좌석 정보 (status로 예약 가능 여부 판단, `0003_create_seats_table.sql`)
  - 샘플 콘서트 데이터 (`0007_seed_sample_data.sql`)
  - 인덱스 설정: `idx_concerts_date`, `idx_seats_concert_status` 등
- ✅ **백엔드 구조**: Hono 기반 라우터 구조 확립
  - `src/backend/hono/app.ts`: Hono 앱 싱글턴 진입점
  - `src/backend/http/response.ts`: `success`, `failure`, `respond` 헬퍼 함수
  - `src/backend/middleware/*`: 에러, 컨텍스트, Supabase 미들웨어
  - `src/features/example/backend/*`: feature별 백엔드 레이어 참조 예시
- ✅ **프론트엔드 구조**: Next.js App Router + React Query
  - `src/app/page.tsx`: 현재 템플릿 홈페이지 (교체 필요)
  - `src/lib/remote/api-client.ts`: Axios 기반 API 클라이언트
  - `src/features/example/*`: feature별 프론트엔드 구조 참조 예시
- ✅ **공통 문서**:
  - `docs/error-codes.md`: 표준화된 에러 코드 정의
  - `docs/validation.md`: Zod 검증 스키마 패턴
  - `docs/state-management.md`: Context API + useReducer 패턴

### 충돌 가능성 검토
- **page.tsx**: 현재 템플릿 홈페이지 → 콘서트 목록 페이지로 완전 교체 필요
- **라우터 등록**: `src/backend/hono/app.ts`의 `createHonoApp()`에 `registerConcertsRoutes` 추가 필요
- **기존 example feature**: 참조 예시로만 활용, 충돌 없음
- **인증 기능**: MVP 단계에서는 인증 없이 구현 (기존 auth 컴포넌트 미사용)

## 개발 단계별 계획

### Phase 1: 백엔드 API 구현

#### 1.1 콘서트 Feature 디렉토리 구조 생성
```
src/features/concerts/
├── backend/
│   ├── route.ts      # Hono 라우터 정의
│   ├── service.ts    # 비즈니스 로직 및 Supabase 쿼리
│   ├── schema.ts     # Zod 스키마 정의
│   └── error.ts      # 에러 코드 정의
├── components/       # 콘서트 관련 컴포넌트
│   ├── ConcertCard.tsx
│   ├── ConcertList.tsx
│   └── ConcertListSkeleton.tsx
├── hooks/           # React Query hooks
│   └── useConcerts.ts
└── lib/             # DTO 재노출 등
    └── dto.ts
```

#### 1.2 에러 코드 정의 (`error.ts`)
**참조**: `docs/error-codes.md`, `src/features/example/backend/error.ts`

```typescript
// src/features/concerts/backend/error.ts
export const concertErrorCodes = {
  notFound: 'CONCERT_NOT_FOUND',
  fetchError: 'CONCERT_FETCH_ERROR',
  validationError: 'CONCERT_VALIDATION_ERROR',
  invalidDateFormat: 'CONCERT_INVALID_DATE_FORMAT',
} as const;

type ConcertErrorValue = (typeof concertErrorCodes)[keyof typeof concertErrorCodes];

export type ConcertServiceError = ConcertErrorValue;
```

**주의사항**:
- `docs/error-codes.md`에 정의된 표준 에러 코드와 일관성 유지
- feature별 에러 코드는 프리픽스로 구분 (`CONCERT_*`)
- `example` feature 패턴과 동일한 구조 사용

#### 1.3 스키마 정의 (`schema.ts`)
**참조**: `docs/validation.md`, `src/features/example/backend/schema.ts`

```typescript
// src/features/concerts/backend/schema.ts
import { z } from 'zod';

// 데이터베이스 Row 스키마 (snake_case)
export const ConcertTableRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  artist: z.string(),
  venue: z.string(),
  date: z.string().datetime(), // ISO 8601 format
  poster_image: z.string().nullable(),
  description: z.string().nullable(),
  total_seats: z.number().int().nonnegative(),
  available_seats: z.number().int().nonnegative(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type ConcertRow = z.infer<typeof ConcertTableRowSchema>;

// API 응답 스키마 (camelCase)
export const ConcertResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  artist: z.string(),
  venue: z.string(),
  date: z.string().datetime(),
  posterImage: z.string().nullable(),
  description: z.string().nullable(),
  totalSeats: z.number().int().nonnegative(),
  availableSeats: z.number().int().nonnegative(),
});

export type ConcertResponse = z.infer<typeof ConcertResponseSchema>;

// 콘서트 목록 응답 스키마
export const ConcertListResponseSchema = z.array(ConcertResponseSchema);

export type ConcertListResponse = z.infer<typeof ConcertListResponseSchema>;
```

**주의사항**:
- 데이터베이스 컬럼명(`snake_case`)과 API 응답 필드명(`camelCase`)을 구분
- `example` feature의 Row → Response 변환 패턴 참조
- 모든 필드에 대해 엄격한 타입 검증 적용

#### 1.4 서비스 로직 구현 (`service.ts`)
**참조**: `src/features/example/backend/service.ts`, `docs/001/spec.md`

```typescript
// src/features/concerts/backend/service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  ConcertTableRowSchema,
  ConcertResponseSchema,
  type ConcertResponse,
} from '@/features/concerts/backend/schema';
import {
  concertErrorCodes,
  type ConcertServiceError,
} from '@/features/concerts/backend/error';

const CONCERTS_TABLE = 'concerts';
const SEATS_TABLE = 'seats';

const fallbackPosterImage = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}/400/600`;

export const getConcerts = async (
  client: SupabaseClient,
): Promise<HandlerResult<ConcertResponse[], ConcertServiceError, unknown>> => {
  // 1. Supabase 쿼리: 콘서트 목록 + 좌석 집계
  const { data, error } = await client
    .from(CONCERTS_TABLE)
    .select(`
      id,
      title,
      artist,
      venue,
      date,
      poster_image,
      description,
      created_at,
      updated_at
    `)
    .gte('date', new Date().toISOString()) // 현재 시각 이후 콘서트만
    .order('date', { ascending: true }); // 날짜 오름차순 정렬

  if (error) {
    return failure(500, concertErrorCodes.fetchError, error.message);
  }

  if (!data || data.length === 0) {
    // 빈 목록도 성공으로 처리
    return success([]);
  }

  // 2. 각 콘서트별 좌석 집계
  const concertIds = data.map((c) => c.id);
  const { data: seatsData, error: seatsError } = await client
    .from(SEATS_TABLE)
    .select('concert_id, status')
    .in('concert_id', concertIds);

  if (seatsError) {
    return failure(500, concertErrorCodes.fetchError, seatsError.message);
  }

  // 3. 좌석 수 집계 (Map 사용)
  const seatCounts = new Map<string, { total: number; available: number }>();

  seatsData?.forEach((seat) => {
    const counts = seatCounts.get(seat.concert_id) || { total: 0, available: 0 };
    counts.total += 1;
    if (seat.status === 'available') {
      counts.available += 1;
    }
    seatCounts.set(seat.concert_id, counts);
  });

  // 4. 응답 데이터 변환 및 검증
  const concerts: ConcertResponse[] = [];

  for (const concert of data) {
    const counts = seatCounts.get(concert.id) || { total: 0, available: 0 };

    // Row 검증
    const rowWithCounts = {
      ...concert,
      total_seats: counts.total,
      available_seats: counts.available,
    };

    const rowParse = ConcertTableRowSchema.safeParse(rowWithCounts);

    if (!rowParse.success) {
      return failure(
        500,
        concertErrorCodes.validationError,
        'Concert row failed validation.',
        rowParse.error.format(),
      );
    }

    // snake_case → camelCase 변환
    const mapped: ConcertResponse = {
      id: rowParse.data.id,
      title: rowParse.data.title,
      artist: rowParse.data.artist,
      venue: rowParse.data.venue,
      date: rowParse.data.date,
      posterImage: rowParse.data.poster_image ?? fallbackPosterImage(rowParse.data.id),
      description: rowParse.data.description,
      totalSeats: rowParse.data.total_seats,
      availableSeats: rowParse.data.available_seats,
    };

    // Response 검증
    const parsed = ConcertResponseSchema.safeParse(mapped);

    if (!parsed.success) {
      return failure(
        500,
        concertErrorCodes.validationError,
        'Concert response failed validation.',
        parsed.error.format(),
      );
    }

    concerts.push(parsed.data);
  }

  return success(concerts);
};
```

**주의사항**:
- `example` feature의 service 패턴 엄격히 준수
- Supabase 쿼리 분리 (concerts 조회 → seats 집계)
- Row 검증 → 변환 → Response 검증 2단계 검증
- 에러 핸들링은 `failure()` 헬퍼 사용
- Fallback 이미지 처리 포함

#### 1.5 라우터 구현 (`route.ts`)
**참조**: `src/features/example/backend/route.ts`

```typescript
// src/features/concerts/backend/route.ts
import type { Hono } from 'hono';
import {
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import { getConcerts } from './service';
import {
  concertErrorCodes,
  type ConcertServiceError,
} from './error';

export const registerConcertsRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/concerts', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getConcerts(supabase);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ConcertServiceError, unknown>;

      if (errorResult.error.code === concertErrorCodes.fetchError) {
        logger.error('Failed to fetch concerts', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};
```

**주의사항**:
- `example` feature의 route 패턴 엄격히 준수
- 파라미터 검증 없음 (GET /api/concerts는 쿼리 파라미터 없음)
- `getSupabase`, `getLogger` 헬퍼 사용
- `respond` 헬퍼로 통일된 응답 형식

#### 1.6 Hono 앱에 라우터 등록
**참조**: `src/backend/hono/app.ts`

```typescript
// src/backend/hono/app.ts 수정
import { registerConcertsRoutes } from '@/features/concerts/backend/route';

export const createHonoApp = () => {
  if (singletonApp) {
    return singletonApp;
  }

  const app = new Hono<AppEnv>();

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  registerExampleRoutes(app);
  registerConcertsRoutes(app); // 추가

  singletonApp = app;

  return app;
};
```

### Phase 2: 프론트엔드 구현

#### 2.1 DTO 재노출 (`lib/dto.ts`)
**참조**: `src/features/example/lib/dto.ts`

```typescript
// src/features/concerts/lib/dto.ts
export type {
  ConcertResponse,
  ConcertListResponse,
} from '@/features/concerts/backend/schema';

export {
  ConcertResponseSchema,
  ConcertListResponseSchema,
} from '@/features/concerts/backend/schema';
```

**주의사항**:
- 프론트엔드에서 백엔드 스키마를 직접 import하지 않고 `lib/dto.ts`를 통해 재노출
- DRY 원칙: 타입과 검증 로직을 한 곳에서 관리

#### 2.2 React Query Hook 구현 (`hooks/useConcerts.ts`)
**참조**: `src/features/example/hooks/useExampleQuery.ts`

```typescript
// src/features/concerts/hooks/useConcerts.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { ConcertListResponseSchema, type ConcertListResponse } from '../lib/dto';

export const useConcerts = () => {
  return useQuery<ConcertListResponse>({
    queryKey: ['concerts'],
    queryFn: async () => {
      const response = await apiClient.get('/api/concerts');
      // 백엔드가 respond()로 반환하므로 response.data가 바로 배열
      return ConcertListResponseSchema.parse(response.data);
    },
    staleTime: 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분 (구 cacheTime)
    refetchOnWindowFocus: true,
    retry: 2,
  });
};
```

**주의사항**:
- `'use client'` 지시문 필수
- `apiClient`를 통해 모든 API 호출
- 응답 데이터를 Zod 스키마로 검증
- `gcTime`은 React Query v5부터 `cacheTime` 대체

#### 2.3 컴포넌트 구현

##### ConcertCard 컴포넌트 (`components/ConcertCard.tsx`)
```typescript
// src/features/concerts/components/ConcertCard.tsx
'use client';

import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ConcertResponse } from '../lib/dto';

interface ConcertCardProps {
  concert: ConcertResponse;
  onClick: () => void;
}

export function ConcertCard({ concert, onClick }: ConcertCardProps) {
  const isSoldOut = concert.availableSeats === 0;
  const availabilityPercent = (concert.availableSeats / concert.totalSeats) * 100;

  const formattedDate = format(parseISO(concert.date), 'yyyy년 M월 d일 (EEE) HH:mm', {
    locale: ko,
  });

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] relative overflow-hidden"
      onClick={onClick}
    >
      {isSoldOut && (
        <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
          <Badge variant="destructive" className="text-xl px-6 py-2">
            매진
          </Badge>
        </div>
      )}

      <div className="relative aspect-[2/3] w-full">
        <Image
          src={concert.posterImage || 'https://picsum.photos/400/600'}
          alt={concert.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <CardContent className="p-4 space-y-2">
        <h3 className="font-bold text-lg line-clamp-1">{concert.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">{concert.artist}</p>

        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="line-clamp-1">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{concert.venue}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className={isSoldOut ? 'text-destructive' : 'text-primary'}>
              잔여 {concert.availableSeats}석 / 전체 {concert.totalSeats}석
            </span>
          </div>
        </div>

        {!isSoldOut && (
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${availabilityPercent}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**필요한 shadcn-ui 컴포넌트**:
```bash
npx shadcn@latest add card
npx shadcn@latest add badge
```

##### ConcertListSkeleton 컴포넌트 (`components/ConcertListSkeleton.tsx`)
```typescript
// src/features/concerts/components/ConcertListSkeleton.tsx
'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function ConcertListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <Skeleton className="aspect-[2/3] w-full" />
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**필요한 shadcn-ui 컴포넌트**:
```bash
npx shadcn@latest add skeleton
```

##### ConcertList 컴포넌트 (`components/ConcertList.tsx`)
```typescript
// src/features/concerts/components/ConcertList.tsx
'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useConcerts } from '../hooks/useConcerts';
import { ConcertCard } from './ConcertCard';
import { ConcertListSkeleton } from './ConcertListSkeleton';

export function ConcertList() {
  const router = useRouter();
  const { data: concerts, isLoading, error, refetch } = useConcerts();

  // 로딩 상태
  if (isLoading) {
    return <ConcertListSkeleton />;
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>콘서트 목록을 불러올 수 없습니다</AlertTitle>
          <AlertDescription>
            네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()}>다시 시도</Button>
      </div>
    );
  }

  // 빈 상태
  if (!concerts || concerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">예약 가능한 콘서트가 없습니다</h3>
          <p className="text-muted-foreground">새로운 공연이 곧 추가될 예정입니다</p>
        </div>
      </div>
    );
  }

  // 정상 상태
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {concerts.map((concert) => (
        <ConcertCard
          key={concert.id}
          concert={concert}
          onClick={() => router.push(`/concerts/${concert.id}`)}
        />
      ))}
    </div>
  );
}
```

**필요한 shadcn-ui 컴포넌트**:
```bash
npx shadcn@latest add alert
npx shadcn@latest add button
```

#### 2.4 메인 페이지 구현 (`src/app/page.tsx`)
```typescript
// src/app/page.tsx
'use client';

import Link from 'next/link';
import { Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConcertList } from '@/features/concerts/components/ConcertList';

export default function HomePage() {
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
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">예약 가능한 콘서트</h2>
            <p className="text-muted-foreground">
              원하는 공연을 선택하고 좌석을 예약하세요
            </p>
          </div>

          <ConcertList />
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2025 BigConcert. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
```

**주의사항**:
- `'use client'` 지시문 필수 (모든 컴포넌트는 Client Component)
- Next.js `<Link>`, `<Image>` 컴포넌트 사용
- shadcn-ui 컴포넌트 활용
- Tailwind CSS 유틸리티 클래스 사용
- Lucide React 아이콘 사용
- 반응형 디자인 (grid-cols-1 → md:grid-cols-2 → lg:grid-cols-3 → xl:grid-cols-4)

### Phase 3: 공통 모듈 정리

#### 3.1 이미 구현된 공통 모듈
- ✅ **HTTP 응답 패턴**: `src/backend/http/response.ts` (success, failure, respond)
- ✅ **Supabase 클라이언트**: `src/backend/middleware/supabase.ts`
- ✅ **API 클라이언트**: `src/lib/remote/api-client.ts` (axios 기반)
- ✅ **에러 코드 정의**: `docs/error-codes.md`

#### 3.2 날짜 유틸리티 (선택사항)
현재는 컴포넌트 내에서 직접 `date-fns` 사용. 향후 공통 모듈 추출 가능:

```typescript
// src/lib/date.ts (선택사항)
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export const formatConcertDate = (dateString: string) => {
  return format(parseISO(dateString), 'yyyy년 M월 d일 (EEE) HH:mm', { locale: ko });
};

export const formatShortDate = (dateString: string) => {
  return format(parseISO(dateString), 'M/d (EEE)', { locale: ko });
};
```

**현재 결정**: 날짜 포맷팅 로직이 간단하고 컴포넌트별로 다를 수 있으므로, MVP에서는 각 컴포넌트에서 직접 사용. 중복이 많아지면 Phase 3 이후 추출.

#### 3.3 공통 모듈 추출 기준
**DRY 원칙 준수 체크리스트**:
- [x] HTTP 응답 패턴 → 이미 공통화됨 (`src/backend/http/response.ts`)
- [x] Supabase 접근 → 이미 공통화됨 (미들웨어)
- [x] API 클라이언트 → 이미 공통화됨 (`api-client.ts`)
- [x] DTO 재노출 패턴 → feature별 `lib/dto.ts`로 표준화
- [ ] 날짜 포맷팅 → MVP에서는 각 컴포넌트에서 직접 사용 (향후 추출 고려)
- [ ] 이미지 fallback → 백엔드 service와 프론트엔드 컴포넌트에서 처리 (충분히 간단)
- [ ] 가격 포맷팅 → 홈 페이지에서는 미사용 (상세 페이지에서 필요 시 추출)

### Phase 4: 테스트 및 검증

#### 4.1 백엔드 API 테스트
**수동 테스트 체크리스트**:
- [ ] GET /api/concerts 정상 응답 확인 (200 OK)
  - 브라우저에서 `http://localhost:3000/api/concerts` 직접 호출
  - 응답 형식이 `ConcertListResponseSchema`와 일치하는지 확인
- [ ] 과거 공연 필터링 확인
  - 현재 시각 이후 콘서트만 반환되는지 확인
  - 샘플 데이터에 과거 콘서트 추가하여 테스트
- [ ] 날짜순 정렬 확인
  - 응답 배열의 첫 번째 항목이 가장 빠른 공연인지 확인
- [ ] 잔여 좌석 집계 정확성
  - `totalSeats`, `availableSeats` 값이 실제 DB와 일치하는지 확인
  - Supabase 대시보드에서 직접 쿼리 결과와 비교
- [ ] 에러 케이스 테스트
  - Supabase 연결 끊김 시 500 에러 반환 확인
  - 에러 로그가 정상적으로 출력되는지 확인

**테스트 도구**:
- 브라우저 DevTools Network 탭
- Postman 또는 Thunder Client (VS Code)
- Supabase 대시보드

#### 4.2 프론트엔드 UI/UX 테스트
**수동 테스트 체크리스트**:
- [ ] 로딩 상태 (isLoading)
  - 페이지 접속 시 스켈레톤 UI가 표시되는지 확인
  - 네트워크를 느리게 설정(Throttling)하여 로딩 상태 확인
- [ ] 정상 상태 (데이터 표시)
  - 콘서트 카드가 그리드 형태로 렌더링되는지 확인
  - 포스터 이미지, 제목, 아티스트, 날짜, 장소, 잔여 좌석이 올바르게 표시되는지 확인
  - 매진 콘서트에 "매진" 배지가 표시되는지 확인
- [ ] 빈 상태 (콘서트 없음)
  - DB에서 모든 콘서트를 과거 날짜로 변경하여 빈 상태 확인
  - "예약 가능한 콘서트가 없습니다" 메시지 표시 확인
- [ ] 에러 상태 (네트워크 오류)
  - 네트워크를 오프라인으로 설정하여 에러 상태 확인
  - 에러 메시지와 "다시 시도" 버튼 표시 확인
  - "다시 시도" 버튼 클릭 시 재시도 동작 확인
- [ ] 상호작용
  - 콘서트 카드 클릭 시 `/concerts/[id]`로 이동하는지 확인
  - 헤더의 "예약 조회" 버튼 클릭 시 `/bookings`로 이동하는지 확인 (미구현 시 404)
  - 카드에 hover 효과 (shadow, scale) 확인
- [ ] 반응형 디자인
  - 모바일 (< 768px): 1열 그리드
  - 태블릿 (768px ~ 1024px): 2열 그리드
  - 데스크톱 (1024px ~ 1280px): 3열 그리드
  - 대형 화면 (>= 1280px): 4열 그리드
- [ ] 이미지 로드 실패 처리
  - 잘못된 이미지 URL로 변경하여 fallback 이미지 표시 확인

**테스트 도구**:
- 브라우저 DevTools (Responsive Mode, Network Throttling)
- React Query DevTools (캐싱 동작 확인)

#### 4.3 성능 최적화 확인
**체크리스트**:
- [x] React Query 캐싱 설정
  - `staleTime: 60 * 1000` (1분)
  - `gcTime: 5 * 60 * 1000` (5분)
  - `refetchOnWindowFocus: true`
- [x] 이미지 최적화
  - Next.js `<Image>` 컴포넌트 사용
  - `sizes` prop으로 반응형 이미지 최적화
- [ ] 불필요한 리렌더링 방지
  - React DevTools Profiler로 렌더링 횟수 확인
  - 필요 시 `React.memo` 적용 (현재는 불필요)
- [ ] 번들 크기 확인
  - `npm run build` 실행 후 번들 크기 확인
  - date-fns, lucide-react 등 라이브러리 트리 쉐이킹 확인

**성능 측정 도구**:
- Lighthouse (Performance, Accessibility, Best Practices, SEO)
- React DevTools Profiler
- Next.js 빌드 분석 (`npm run build`)

## 예상 구현 시간

| Phase | 작업 내용 | 예상 시간 | 세부 사항 |
|-------|----------|---------|----------|
| Phase 1 | 백엔드 API 구현 | 2-3시간 | error.ts, schema.ts, service.ts, route.ts 작성 및 라우터 등록 |
| Phase 2 | 프론트엔드 구현 | 3-4시간 | DTO, hook, 컴포넌트 3개, page.tsx 작성 |
| Phase 3 | 공통 모듈 정리 | 0.5시간 | 기존 공통 모듈 활용, 추가 작업 최소화 |
| Phase 4 | 테스트 및 검증 | 1-2시간 | 수동 테스트, 성능 확인, 디버깅 |
| **총계** | **전체 구현** | **6.5-9.5시간** | shadcn-ui 설치 시간 제외 |

**추가 소요 시간**:
- shadcn-ui 컴포넌트 설치: 약 10분 (card, badge, skeleton, alert, button)
- Next.js 이미지 최적화 설정: 약 5분

## 위험 요소 및 대응 방안

### 1. 시간대 처리
**위험**: 서버/클라이언트 시간대 불일치로 인한 콘서트 목록 필터링 오류

**대응 방안**:
- 백엔드: Supabase에서 `date >= NOW()`로 필터링 (DB 시간대 기준)
- 프론트엔드: `date-fns`의 `parseISO`로 ISO 8601 문자열을 사용자 로컬 시간대로 자동 변환
- 환경 변수: `TZ=Asia/Seoul` 설정 (Node.js 서버)
- 테스트: 다양한 시간대에서 테스트 (UTC, KST, PST)

### 2. Supabase 쿼리 성능
**위험**: 콘서트 수 증가 시 JOIN 쿼리 성능 저하

**대응 방안**:
- 현재: 인덱스 설정으로 최적화 (`idx_concerts_date`, `idx_seats_concert_status`)
- MVP: 전체 콘서트 로드 (예상 최대 100개)
- 향후:
  - 페이지네이션 구현 (limit, offset)
  - Supabase View로 좌석 집계 쿼리 최적화
  - Redis 캐싱 도입

### 3. 실시간 좌석 현황 불일치
**위험**: 목록 페이지의 잔여 좌석 정보가 실제와 다를 수 있음

**대응 방안**:
- React Query의 `refetchOnWindowFocus: true`로 포커스 시 갱신
- `staleTime: 60 * 1000`으로 1분마다 자동 갱신
- 상세 페이지 진입 시 최신 정보 재확인 (별도 API 호출)
- 사용자에게 "잔여 좌석은 참고용이며 실시간 정보가 아닙니다" 안내

### 4. 이미지 로드 실패
**위험**: 외부 이미지 URL 접근 불가 시 UI 깨짐

**대응 방안**:
- 백엔드: `poster_image` NULL 시 fallback URL 반환 (`https://picsum.photos/seed/{id}/400/600`)
- 프론트엔드: `Next/Image` 컴포넌트의 자동 에러 처리 활용
- 개발 중: picsum.photos placeholder 사용
- 운영 환경: CDN 기반 이미지 서버 구축 권장

### 5. 데이터베이스 마이그레이션 누락
**위험**: 로컬 개발 환경에 테이블이 없어 API 호출 실패

**대응 방안**:
- 개발 시작 전 체크리스트:
  ```bash
  # Supabase 마이그레이션 적용 확인
  # Supabase 대시보드에서 테이블 존재 확인:
  # - concerts, seats, bookings, booking_seats

  # 샘플 데이터 확인
  # SELECT COUNT(*) FROM concerts;
  # SELECT COUNT(*) FROM seats;
  ```
- 마이그레이션 파일 위치: `/supabase/migrations/0001_*.sql ~ 0007_*.sql`
- Supabase 환경 변수 설정 확인: `.env.local`에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## 구현 순서 요약

**단계별 구현 체크리스트**:

### Step 1: 백엔드 구조 생성
```bash
mkdir -p src/features/concerts/backend
```
- [ ] `src/features/concerts/backend/error.ts`
- [ ] `src/features/concerts/backend/schema.ts`
- [ ] `src/features/concerts/backend/service.ts`
- [ ] `src/features/concerts/backend/route.ts`
- [ ] `src/backend/hono/app.ts` 수정 (라우터 등록)

### Step 2: 프론트엔드 구조 생성
```bash
mkdir -p src/features/concerts/lib
mkdir -p src/features/concerts/hooks
mkdir -p src/features/concerts/components
```
- [ ] `src/features/concerts/lib/dto.ts`
- [ ] `src/features/concerts/hooks/useConcerts.ts`
- [ ] `src/features/concerts/components/ConcertCard.tsx`
- [ ] `src/features/concerts/components/ConcertListSkeleton.tsx`
- [ ] `src/features/concerts/components/ConcertList.tsx`
- [ ] `src/app/page.tsx` 교체

### Step 3: shadcn-ui 설치
```bash
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add skeleton
npx shadcn@latest add alert
npx shadcn@latest add button
```

### Step 4: 테스트
- [ ] 백엔드 API 테스트 (`http://localhost:3000/api/concerts`)
- [ ] 프론트엔드 UI 테스트 (로딩, 에러, 빈 상태, 정상 상태)
- [ ] 반응형 디자인 확인
- [ ] 성능 측정 (Lighthouse)

## 다음 단계 준비사항

이 홈 페이지 구현 완료 후 다음 페이지들을 순서대로 개발:

1. **콘서트 상세 페이지** (`/concerts/[id]`)
   - 참조: `docs/002/spec.md` (콘서트 상세 정보 조회)
   - 백엔드: `GET /api/concerts/:id`, `GET /api/concerts/:id/seats/summary`
   - 프론트엔드: `src/app/concerts/[id]/page.tsx`

2. **좌석 선택 페이지** (`/concerts/[id]/seats`)
   - 참조: `docs/003/spec.md` (좌석 선택)
   - 참조: `docs/state-management.md` (Context API 패턴)
   - 백엔드: `GET /api/concerts/:id/seats`, `POST /api/seats/check-availability`
   - 프론트엔드: `src/app/concerts/[id]/seats/page.tsx`
   - 상태 관리: Context API + useReducer

3. **예약 정보 입력 페이지** (`/concerts/[id]/booking`)
   - 참조: `docs/004/spec.md` (예약 생성)
   - 참조: `docs/validation.md` (Zod 검증)
   - 백엔드: `POST /api/bookings`
   - 프론트엔드: `src/app/concerts/[id]/booking/page.tsx`

4. **예약 완료 페이지** (`/concerts/[id]/confirmation`)
   - 참조: `docs/004/spec.md`
   - 프론트엔드: `src/app/concerts/[id]/confirmation/page.tsx`

5. **예약 조회 페이지** (`/bookings`)
   - 참조: `docs/006/spec.md` (예약 조회)
   - 백엔드: `POST /api/bookings/search`
   - 프론트엔드: `src/app/bookings/page.tsx`

## 참고 문서

### 핵심 문서
- **[PRD](../prd.md)**: 제품 요구사항 정의서
- **[콘서트 목록 조회 스펙](../001/spec.md)**: 유스케이스 상세 명세
- **[데이터베이스 스키마](../../supabase/migrations/)**: 테이블 구조 및 마이그레이션

### 코드베이스 규칙
- **[CLAUDE.md](../../CLAUDE.md)**: 프로젝트 전체 가이드라인
- **[error-codes.md](../error-codes.md)**: 표준 에러 코드 정의
- **[validation.md](../validation.md)**: Zod 검증 스키마 패턴
- **[state-management.md](../state-management.md)**: 상태 관리 설계 (좌석 선택용)

### 참조 예시
- **[example feature](../../src/features/example/)**: feature 구조 참조
  - `backend/error.ts`: 에러 코드 패턴
  - `backend/schema.ts`: Row → Response 변환 패턴
  - `backend/service.ts`: Supabase 쿼리 및 검증 패턴
  - `backend/route.ts`: Hono 라우터 패턴
  - `lib/dto.ts`: DTO 재노출 패턴
  - `hooks/useExampleQuery.ts`: React Query hook 패턴

## 버전 정보
- **작성일**: 2025-10-15
- **버전**: 2.0.0
- **변경 이력**:
  - v2.0.0: 기존 코드베이스 패턴 준수, 구체적인 구현 코드 추가, 테스트 전략 상세화
  - v1.0.0: 초기 계획 작성