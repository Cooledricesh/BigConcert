# PRD: 콘서트 예약 시스템 (MVP)

## 제품 개요

### 목적
사용자가 온라인으로 간단하게 콘서트를 조회하고, 좌석을 선택하여 예약할 수 있는 웹 기반 콘서트 예약 플랫폼 MVP

### 핵심 가치
- **간편성**: 회원가입 없이 간단한 정보로 빠르게 예약
- **투명성**: 실시간 좌석 현황 확인
- **최소화**: 예약에 필요한 핵심 기능만 제공

### 주요 기능
1. 콘서트 목록 조회
2. 콘서트 상세 정보 및 등급별 잔여 좌석 확인
3. 좌석 배치도에서 좌석 선택 (등급별 가격 차별화)
4. 예약자 정보 입력 (이름, 전화번호, 비밀번호 4자리)
5. 예약 완료
6. 예약 조회 (전화번호 + 비밀번호로 조회)

---

## Stakeholders

| 역할 | 니즈 |
|------|------|
| **최종 사용자 (콘서트 관람객)** | 간편한 예약, 좌석 선택, 예약 조회 |

---

## 포함 페이지

### 1. 홈 (콘서트 목록) (`/`)
**목적**: 메인 페이지에서 바로 콘서트 목록 조회

**주요 기능**:
- 콘서트 목록 리스트 표시
- 콘서트 썸네일, 제목, 날짜, 장소 표시
- 콘서트 클릭 시 상세 페이지 이동

### 2. 콘서트 상세 페이지 (`/concerts/[id]`)
**목적**: 콘서트 상세 정보 및 등급별 잔여 좌석 확인

**주요 기능**:
- 콘서트 포스터 이미지
- 공연 정보:
  - 제목, 아티스트
  - 일시 (날짜, 시간)
  - 장소
  - 공연 설명
- 등급별 잔여 좌석 현황:
  - 좌석 등급별 가격표
  - 등급별 잔여/전체 좌석 수
  - 시각적 잔여 좌석 바 그래프
- 예약 정보 요약 (전체 남은 좌석/전체 좌석)
- "예약하기" 버튼 (좌석 선택 페이지로 이동)

### 3. 좌석 선택 페이지 (`/concerts/[id]/seats`)
**목적**: 좌석 배치도에서 원하는 좌석 선택

**주요 기능**:
- 등급별 가격 안내:
  - Special (1-3열)
  - Premium (4-7열)
  - Advanced (8-15열)
  - Regular (16-20열)
- 좌석 배치도:
  - 구역별 표시 (A, B, C, D 구역)
  - 좌석 상태 표시:
    - 선택 가능 (등급별 색상)
    - 선택됨 (강조 표시)
    - 예약 완료 (회색)
  - 좌석 클릭으로 선택/해제
- 선택된 좌석 정보:
  - 좌석 번호 (구역-열-번호)
  - 등급 및 개별 가격
  - 총 금액
- "예약하기" 버튼 (예약 정보 입력 페이지로 이동)

### 4. 예약 정보 입력 페이지 (`/concerts/[id]/booking`)
**목적**: 예약자 정보 입력

**주요 기능**:
- 선택한 콘서트 및 좌석 정보 요약
- 예약자 정보 입력 폼:
  - 예약자명 (필수)
  - 전화번호 (필수)
  - 비밀번호 4자리 (필수, 예약 조회용)
- 총 금액 표시
- "예약 완료" 버튼

### 5. 예약 완료 페이지 (`/concerts/[id]/confirmation`)
**목적**: 예약 완료 확인

**주요 기능**:
- 예약 완료 메시지
- 예약 상세 정보 (콘서트, 좌석, 예약자명, 전화번호)
- "예약 조회" 버튼
- "홈으로" 버튼

### 6. 예약 조회 페이지 (`/bookings`)
**목적**: 예약 내역 조회

**주요 기능**:
- 조회 폼:
  - 전화번호 입력
  - 비밀번호 4자리 입력
- "조회" 버튼
- 조회 결과: 예약 상세 정보 표시

### 네비게이션 구조
**헤더 (모든 페이지 공통)**:
- 로고 "BigConcert" (클릭 시 홈으로)
- 우측 상단: "예약 조회" 링크

---

## 사용자 여정

### 타겟 유저 Segment

**일반 콘서트 관람객**
- 니즈: 간단한 예약 프로세스, 좌석 선택, 예약 확인

### 사용자 여정 맵

#### Journey 1: 콘서트 예약

| 단계 | 페이지 | 사용자 행동 | 목표 |
|------|--------|------------|------|
| **1. 홈 접속** | `/` | 콘서트 목록 확인 | 관심 콘서트 찾기 |
| **2. 상세 확인** | `/concerts/[id]` | 콘서트 정보 및 등급별 잔여 좌석 확인 | 예약 결정 |
| **3. 좌석 선택** | `/concerts/[id]/seats` | 좌석 배치도에서 원하는 좌석 선택 | 좌석 선택 |
| **4. 예약 정보 입력** | `/concerts/[id]/booking` | 예약자명, 전화번호, 비밀번호 4자리 입력 | 예약 완료 |
| **5. 예약 완료** | `/concerts/[id]/confirmation` | 예약 정보 확인 | 예약 확인 |

#### Journey 2: 예약 조회

| 단계 | 페이지 | 사용자 행동 | 목표 |
|------|--------|------------|------|
| **1. 조회** | `/bookings` | 전화번호 + 비밀번호 4자리 입력 | 예약 내역 확인 |
| **2. 확인** | `/bookings` | 예약 상세 정보 확인 | 예약 상태 파악 |

---

## IA (Information Architecture)

### 사이트 구조 (Tree)

```
/ (홈 = 콘서트 목록)
│
├── 콘서트 상세 (/concerts/[id])
│   │
│   ├── 좌석 선택 (/concerts/[id]/seats)
│   │   │
│   │   ├── 예약 정보 입력 (/concerts/[id]/booking)
│   │   │
│   │   └── 예약 완료 (/concerts/[id]/confirmation)
│   │
│   └── [예약하기 버튼]
│
└── 예약 조회 (/bookings)
```

### 핵심 예약 플로우

```
1. 홈 (/)
   ↓ [콘서트 선택]

2. 콘서트 상세 (/concerts/[id])
   ↓ [예약하기 버튼 클릭]

3. 좌석 선택 (/concerts/[id]/seats)
   ↓ [좌석 선택 후 예약하기]

4. 예약 정보 입력 (/concerts/[id]/booking)
   ↓ [예약자명, 전화번호, 비밀번호 입력]

5. 예약 완료 (/concerts/[id]/confirmation)

6. 예약 조회 (/bookings)
   [전화번호 + 비밀번호로 조회]
```

---

## 기술 요구사항

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: React, shadcn-ui, TailwindCSS
- **State Management**: @tanstack/react-query, zustand
- **Form Handling**: react-hook-form + zod

### Backend
- **API**: Hono (delegated to Next.js Route Handler)
- **Database**: Supabase (PostgreSQL)

### 핵심 데이터 모델

#### 1. concerts
```sql
- id (uuid, primary key)
- title (text)
- artist (text)
- venue (text)
- date (timestamp)
- poster_image (text)
- created_at (timestamp)
```

#### 2. seats
```sql
- id (uuid, primary key)
- concert_id (uuid, foreign key → concerts.id)
- section (text) -- 구역: A, B, C, D
- row (integer) -- 열: 1, 2, 3, ... 20
- number (integer) -- 좌석 번호: 1, 2, 3, 4
- grade (text) -- 등급: Special, Premium, Advanced, Regular
- price (integer) -- 등급별 가격
- status (text) -- available, reserved
- created_at (timestamp)
```

#### 좌석 등급별 가격 정책
| 등급 | 열 범위 | 가격 예시 |
|------|---------|-----------|
| Special | 1-3열 | 250,000원 |
| Premium | 4-7열 | 190,000원 |
| Advanced | 8-15열 | 170,000원 |
| Regular | 16-20열 | 140,000원 |

#### 3. bookings
```sql
- id (uuid, primary key)
- concert_id (uuid, foreign key → concerts.id)
- user_name (text)
- user_phone (text)
- password (text) -- 4자리 비밀번호 (해시 저장)
- total_price (integer)
- status (text) -- confirmed, cancelled
- created_at (timestamp)
```

#### 4. booking_seats
```sql
- id (uuid, primary key)
- booking_id (uuid, foreign key → bookings.id)
- seat_id (uuid, foreign key → seats.id)
- created_at (timestamp)
```

---

## 기술 구현 세부사항

### 디렉토리 구조

```
src/
├── app/                           # Next.js App Router
│   ├── page.tsx                  # 홈(콘서트 목록)
│   ├── concerts/
│   │   └── [id]/
│   │       ├── page.tsx          # 콘서트 상세
│   │       ├── seats/
│   │       │   └── page.tsx      # 좌석 선택
│   │       ├── booking/
│   │       │   └── page.tsx      # 예약 정보 입력
│   │       └── confirmation/
│   │           └── page.tsx      # 예약 완료
│   ├── bookings/
│   │   └── page.tsx              # 예약 조회
│   └── api/
│       └── [[...hono]]/
│           └── route.ts          # Hono 엔트리포인트
├── features/
│   ├── concerts/                 # 콘서트 기능
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── constants/
│   │   └── backend/
│   │       ├── route.ts          # Hono 라우터
│   │       ├── service.ts        # 비즈니스 로직
│   │       ├── schema.ts         # zod 스키마
│   │       └── error.ts          # 에러 코드 정의
│   ├── booking/                  # 예약 기능
│   │   ├── components/
│   │   ├── hooks/
│   │   └── backend/
│   │       ├── route.ts
│   │       ├── service.ts
│   │       ├── schema.ts
│   │       └── error.ts
│   └── seats/                    # 좌석 기능
│       ├── components/
│       ├── hooks/
│       └── backend/
│           ├── route.ts
│           ├── service.ts
│           ├── schema.ts
│           └── error.ts
├── backend/
│   ├── hono/
│   │   ├── app.ts               # Hono 앱 생성
│   │   └── context.ts           # AppEnv 타입 정의
│   ├── middleware/              # 공통 미들웨어
│   ├── http/                    # HTTP 응답 헬퍼
│   ├── supabase/               # Supabase 클라이언트
│   └── config/                 # 환경 변수 설정
├── components/
│   └── ui/                     # shadcn-ui 컴포넌트
├── lib/
│   └── remote/
│       └── api-client.ts       # API 클라이언트
└── hooks/                      # 공통 hooks
```

### 백엔드 레이어 구조

#### Feature별 백엔드 구조
각 feature는 다음 파일들을 포함:

1. **route.ts** - Hono 라우터 정의
```typescript
// 예시: /features/concerts/backend/route.ts
export const concertsRoute = (app: HonoApp) => {
  app.get('/api/concerts', getConcerts)
  app.get('/api/concerts/:id', getConcertById)
}
```

2. **service.ts** - Supabase 접근 및 비즈니스 로직
```typescript
// 예시: /features/concerts/backend/service.ts
export const getConcerts = async (supabase: SupabaseClient) => {
  // Supabase 쿼리 및 비즈니스 로직
}
```

3. **schema.ts** - 요청/응답 zod 스키마 정의
```typescript
// 예시: /features/concerts/backend/schema.ts
export const ConcertSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  // ...
})
```

4. **error.ts** - 상황별 에러 코드 정의
```typescript
// 예시: /features/concerts/backend/error.ts
export const ConcertErrors = {
  NOT_FOUND: 'CONCERT_NOT_FOUND',
  SOLD_OUT: 'CONCERT_SOLD_OUT'
}
```

#### HTTP 응답 패턴
모든 라우터/서비스는 공통 응답 패턴 사용:
- `success(data)` - 성공 응답
- `failure(error)` - 실패 응답
- `respond(result)` - 조건부 응답

### 프론트엔드 구현 지침

#### 컴포넌트 규칙
1. **모든 컴포넌트는 Client Component로 작성**
```typescript
"use client"  // 파일 최상단에 명시

export function ConcertCard() {
  // ...
}
```

2. **Page.tsx params 처리**
```typescript
// app/concerts/[id]/page.tsx
export default async function ConcertDetailPage({
  params
}: {
  params: Promise<{ id: string }>  // Promise로 타입 정의
}) {
  const { id } = await params
  // ...
}
```

3. **API 호출 규칙**
```typescript
// @/lib/remote/api-client를 통해 모든 API 호출
import { apiClient } from '@/lib/remote/api-client'

// React Query hook 내에서 사용
const { data } = useQuery({
  queryKey: ['concerts'],
  queryFn: () => apiClient.get('/api/concerts')
})
```

4. **이미지 처리**
```typescript
// 개발 중 placeholder 이미지 사용
<img src="https://picsum.photos/400/600" alt="콘서트 포스터" />
```

### Supabase 마이그레이션 지침

#### 파일 네이밍 규칙
```
supabase/migrations/
├── 0001_create_concerts_table.sql
├── 0002_create_seats_table.sql
├── 0003_create_bookings_table.sql
└── 0004_create_booking_seats_table.sql
```

#### 마이그레이션 필수 요소
1. **테이블 생성 시 IF NOT EXISTS 사용**
```sql
CREATE TABLE IF NOT EXISTS concerts (
  -- ...
);
```

2. **updated_at 컬럼과 자동 업데이트 트리거**
```sql
-- 모든 테이블에 updated_at 추가
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

-- 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_concerts_updated_at
  BEFORE UPDATE ON concerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

3. **RLS (Row Level Security) 비활성화**
```sql
ALTER TABLE concerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE seats DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_seats DISABLE ROW LEVEL SECURITY;
```

4. **외래 키 제약조건**
```sql
FOREIGN KEY (concert_id) REFERENCES concerts(id) ON DELETE CASCADE
```

---

## MVP 범위 외 (향후 확장)

- 회원가입/로그인 시스템
- 실제 결제 연동 (PG사 연동)
- 검색 및 필터링 기능
- 예약 취소 기능
- 이메일 알림
- 관리자 대시보드
- 좌석 선택 시 실시간 업데이트 (WebSocket)
- 연속 좌석 자동 추천
- 무대 위치 기준 좌석 뷰 미리보기
