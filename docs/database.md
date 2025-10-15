# 콘서트 예약 시스템 데이터베이스 설계

## 개요
본 문서는 콘서트 예약 시스템의 데이터베이스 스키마 설계를 정의합니다.
PostgreSQL을 기반으로 하며, 유저플로우에 명시된 기능 구현에 필요한 최소 스펙으로 설계되었습니다.

---

## 데이터플로우

### 1. 콘서트 목록 조회 플로우
```
[클라이언트]
    ↓ GET /api/concerts
[concerts 테이블]
    ↓ WHERE date >= NOW() (과거 공연 필터링)
    ↓ ORDER BY date ASC
[seats 테이블]
    ↓ LEFT JOIN & COUNT (잔여좌석 집계)
    ↓ GROUP BY concert_id
[응답]
    - 콘서트 목록
    - 각 콘서트별 전체/잔여 좌석 수
```

### 2. 콘서트 상세 조회 플로우
```
[클라이언트]
    ↓ GET /api/concerts/:id
[concerts 테이블]
    ↓ WHERE id = :id
[seats 테이블]
    ↓ JOIN ON concert_id = :id
    ↓ GROUP BY grade (등급별 집계)
    ↓ COUNT(status = 'available') as 잔여
    ↓ COUNT(*) as 전체
[응답]
    - 콘서트 상세 정보
    - 등급별 좌석 현황 (Special/Premium/Advanced/Regular)
    - 등급별 가격 정보
```

### 3. 좌석 선택 플로우
```
[클라이언트]
    ↓ GET /api/concerts/:id/seats
[seats 테이블]
    ↓ WHERE concert_id = :id
    ↓ ORDER BY section, row, number
[응답]
    - 전체 320개 좌석 배치도
    - 각 좌석의 상태 (available/reserved)
    - 구역-열-번호 (예: A-1-3)
    - 등급 및 가격 정보
```

### 4. 예약 완료 플로우
```
[클라이언트]
    ↓ POST /api/bookings
    ↓ {user_name, user_phone, password, seat_ids[]}
[트랜잭션 시작]
    ↓
[seats 테이블]
    ↓ SELECT ... FOR UPDATE (좌석 Lock)
    ↓ WHERE id IN (seat_ids) AND status = 'available'
    ↓ 좌석 가용성 확인
[bookings 테이블]
    ↓ INSERT (예약 마스터 정보)
    ↓ 예약번호 생성 (UUID)
    ↓ 비밀번호 해시 처리
    ↓ 총 금액 계산
[booking_seats 테이블]
    ↓ INSERT (좌석별 매핑)
    ↓ booking_id ← seat_id 연결
[seats 테이블]
    ↓ UPDATE status = 'reserved'
    ↓ WHERE id IN (seat_ids)
[트랜잭션 커밋]
    ↓
[응답]
    - 예약 ID
    - 예약 완료 정보
```

### 5. 예약 조회 플로우
```
[클라이언트]
    ↓ POST /api/bookings/search
    ↓ {user_phone, password}
[bookings 테이블]
    ↓ WHERE user_phone = :phone
    ↓ 비밀번호 해시 검증
[concerts 테이블]
    ↓ JOIN ON concert_id
[booking_seats + seats 테이블]
    ↓ JOIN 좌석 상세 정보
[응답]
    - 예약 목록 (복수 가능)
    - 콘서트 정보
    - 좌석 정보 (구역-열-번호)
    - 예약자 정보
```

---

## 데이터베이스 스키마

### 1. concerts (콘서트 정보)
콘서트 기본 정보를 저장하는 마스터 테이블

```sql
CREATE TABLE IF NOT EXISTS concerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,                    -- 콘서트 제목
    artist TEXT NOT NULL,                    -- 아티스트명
    venue TEXT NOT NULL,                     -- 공연 장소
    date TIMESTAMP WITH TIME ZONE NOT NULL,  -- 공연 일시
    poster_image TEXT,                       -- 포스터 이미지 URL
    description TEXT,                        -- 공연 설명
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_concerts_date ON concerts(date);
CREATE INDEX idx_concerts_created_at ON concerts(created_at DESC);
```

### 2. seats (좌석 정보)
콘서트별 좌석 상세 정보 (총 320석 = 4구역 × 20열 × 4좌석)

```sql
CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concert_id UUID NOT NULL REFERENCES concerts(id) ON DELETE CASCADE,
    section TEXT NOT NULL,                   -- 구역: A, B, C, D
    row INTEGER NOT NULL,                    -- 열: 1-20
    number INTEGER NOT NULL,                 -- 좌석번호: 1-4
    grade TEXT NOT NULL,                     -- 등급: Special, Premium, Advanced, Regular
    price INTEGER NOT NULL,                  -- 가격 (원 단위)
    status TEXT NOT NULL DEFAULT 'available', -- 상태: available, reserved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 제약조건
    CONSTRAINT seats_section_check CHECK (section IN ('A', 'B', 'C', 'D')),
    CONSTRAINT seats_row_check CHECK (row BETWEEN 1 AND 20),
    CONSTRAINT seats_number_check CHECK (number BETWEEN 1 AND 4),
    CONSTRAINT seats_grade_check CHECK (grade IN ('Special', 'Premium', 'Advanced', 'Regular')),
    CONSTRAINT seats_status_check CHECK (status IN ('available', 'reserved')),
    CONSTRAINT seats_unique_position UNIQUE (concert_id, section, row, number)
);

-- 인덱스
CREATE INDEX idx_seats_concert_id ON seats(concert_id);
CREATE INDEX idx_seats_concert_status ON seats(concert_id, status);
CREATE INDEX idx_seats_concert_grade ON seats(concert_id, grade);
CREATE INDEX idx_seats_position ON seats(concert_id, section, row, number);
```

### 3. bookings (예약 정보)
예약 마스터 정보

```sql
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concert_id UUID NOT NULL REFERENCES concerts(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,                 -- 예약자명
    user_phone TEXT NOT NULL,                -- 전화번호
    password_hash TEXT NOT NULL,             -- 비밀번호 해시 (4자리)
    total_price INTEGER NOT NULL,            -- 총 금액
    status TEXT NOT NULL DEFAULT 'confirmed', -- 상태: confirmed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 제약조건
    CONSTRAINT bookings_status_check CHECK (status IN ('confirmed', 'cancelled'))
);

-- 인덱스
CREATE INDEX idx_bookings_user_phone ON bookings(user_phone);
CREATE INDEX idx_bookings_concert_id ON bookings(concert_id);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX idx_bookings_phone_status ON bookings(user_phone, status);
```

### 4. booking_seats (예약-좌석 매핑)
예약과 좌석을 연결하는 매핑 테이블

```sql
CREATE TABLE IF NOT EXISTS booking_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 제약조건
    CONSTRAINT booking_seats_unique UNIQUE (booking_id, seat_id)
);

-- 인덱스
CREATE INDEX idx_booking_seats_booking_id ON booking_seats(booking_id);
CREATE INDEX idx_booking_seats_seat_id ON booking_seats(seat_id);
```

---

## 트리거 및 함수

### updated_at 자동 업데이트 트리거

```sql
-- 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_concerts_updated_at
    BEFORE UPDATE ON concerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seats_updated_at
    BEFORE UPDATE ON seats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_seats_updated_at
    BEFORE UPDATE ON booking_seats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Row Level Security (RLS) 비활성화

```sql
ALTER TABLE concerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE seats DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_seats DISABLE ROW LEVEL SECURITY;
```

---

## 주요 쿼리 예시

### 1. 콘서트 목록 조회 (잔여 좌석 포함)
```sql
SELECT
    c.*,
    COUNT(s.id) as total_seats,
    COUNT(CASE WHEN s.status = 'available' THEN 1 END) as available_seats
FROM concerts c
LEFT JOIN seats s ON c.id = s.concert_id
WHERE c.date >= NOW()
GROUP BY c.id
ORDER BY c.date ASC;
```

### 2. 등급별 좌석 현황 조회
```sql
SELECT
    grade,
    price,
    COUNT(*) as total_seats,
    COUNT(CASE WHEN status = 'available' THEN 1 END) as available_seats
FROM seats
WHERE concert_id = :concert_id
GROUP BY grade, price
ORDER BY
    CASE grade
        WHEN 'Special' THEN 1
        WHEN 'Premium' THEN 2
        WHEN 'Advanced' THEN 3
        WHEN 'Regular' THEN 4
    END;
```

### 3. 좌석 예약 트랜잭션
```sql
BEGIN;

-- 좌석 잠금 및 가용성 확인
SELECT * FROM seats
WHERE id = ANY(:seat_ids)
AND status = 'available'
FOR UPDATE;

-- 예약 생성
INSERT INTO bookings (concert_id, user_name, user_phone, password_hash, total_price, status)
VALUES (:concert_id, :user_name, :user_phone, :password_hash, :total_price, 'confirmed')
RETURNING id;

-- 좌석 매핑
INSERT INTO booking_seats (booking_id, seat_id)
SELECT :booking_id, unnest(:seat_ids);

-- 좌석 상태 업데이트
UPDATE seats
SET status = 'reserved', updated_at = NOW()
WHERE id = ANY(:seat_ids);

COMMIT;
```

### 4. 예약 조회
```sql
SELECT
    b.*,
    c.title as concert_title,
    c.date as concert_date,
    c.venue as concert_venue,
    json_agg(
        json_build_object(
            'section', s.section,
            'row', s.row,
            'number', s.number,
            'grade', s.grade,
            'price', s.price
        ) ORDER BY s.section, s.row, s.number
    ) as seats
FROM bookings b
JOIN concerts c ON b.concert_id = c.id
JOIN booking_seats bs ON b.id = bs.booking_id
JOIN seats s ON bs.seat_id = s.id
WHERE b.user_phone = :user_phone
AND b.status = 'confirmed'
GROUP BY b.id, c.title, c.date, c.venue
ORDER BY b.created_at DESC;
```

---

## 데이터 무결성 보장

### 1. 좌석 중복 예약 방지
- `seats` 테이블의 `status` 컬럼과 트랜잭션 레벨 Lock 사용
- `FOR UPDATE` 구문으로 동시성 제어

### 2. 좌석 위치 유일성
- `UNIQUE` 제약조건으로 동일 콘서트 내 좌석 위치 중복 방지
- (concert_id, section, row, number) 조합 유니크

### 3. 참조 무결성
- 외래키 제약조건으로 데이터 일관성 유지
- CASCADE DELETE로 관련 데이터 자동 정리

### 4. 데이터 유효성
- CHECK 제약조건으로 잘못된 값 입력 방지
- 구역(A-D), 열(1-20), 번호(1-4) 범위 검증

---

## 성능 최적화 고려사항

### 1. 인덱스 전략
- 자주 조회되는 컬럼에 인덱스 생성
- 복합 인덱스로 쿼리 성능 향상
- 외래키 컬럼 자동 인덱싱

### 2. 쿼리 최적화
- N+1 문제 방지를 위한 JOIN 사용
- 집계 쿼리에 적절한 GROUP BY
- 불필요한 데이터 조회 최소화

### 3. 트랜잭션 관리
- 예약 처리 시 최소한의 Lock 시간
- 적절한 격리 수준 설정
- 데드락 방지 고려

---

## 보안 고려사항

### 1. 비밀번호 보안
- 4자리 비밀번호 해시 처리 (bcrypt 권장)
- 평문 저장 금지

### 2. SQL Injection 방지
- Prepared Statement 사용
- 파라미터 바인딩

### 3. 데이터 검증
- 입력값 서버 측 재검증
- 타입 및 범위 검증

---

## 확장 가능성

### 향후 추가 가능 기능
1. 회원 시스템 추가 시 `users` 테이블
2. 결제 정보 추가 시 `payments` 테이블
3. 예약 취소 기능 시 `status` 활용
4. 좌석 선호도 추가 시 `seat_preferences` 테이블

---

## 버전 정보
- 작성일: 2025-10-15
- 버전: 1.0.0
- 기반 문서: PRD v1.0, 유저플로우 v1.1.0