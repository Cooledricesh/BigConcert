-- 0003_create_seats_table.sql
-- 콘서트별 좌석 상세 정보 (총 320석 = 4구역 × 20열 × 4좌석)

-- 테이블 생성
CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concert_id UUID NOT NULL,
    section TEXT NOT NULL,                   -- 구역: A, B, C, D
    row INTEGER NOT NULL,                    -- 열: 1-20
    number INTEGER NOT NULL,                 -- 좌석번호: 1-4
    grade TEXT NOT NULL,                     -- 등급: Special, Premium, Advanced, Regular
    price INTEGER NOT NULL,                  -- 가격 (원 단위)
    status TEXT NOT NULL DEFAULT 'available', -- 상태: available, reserved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 외래키 제약조건
    CONSTRAINT fk_seats_concert
        FOREIGN KEY (concert_id)
        REFERENCES concerts(id)
        ON DELETE CASCADE,

    -- 데이터 유효성 검증 제약조건
    CONSTRAINT seats_section_check
        CHECK (section IN ('A', 'B', 'C', 'D')),
    CONSTRAINT seats_row_check
        CHECK (row BETWEEN 1 AND 20),
    CONSTRAINT seats_number_check
        CHECK (number BETWEEN 1 AND 4),
    CONSTRAINT seats_grade_check
        CHECK (grade IN ('Special', 'Premium', 'Advanced', 'Regular')),
    CONSTRAINT seats_status_check
        CHECK (status IN ('available', 'reserved')),
    CONSTRAINT seats_price_check
        CHECK (price > 0),

    -- 좌석 위치 유일성 제약조건 (동일 콘서트 내 중복 좌석 방지)
    CONSTRAINT seats_unique_position
        UNIQUE (concert_id, section, row, number)
);

-- 테이블 설명
COMMENT ON TABLE seats IS '콘서트별 좌석 정보 (총 320석 = 4구역 × 20열 × 4좌석)';
COMMENT ON COLUMN seats.id IS '좌석 고유 식별자';
COMMENT ON COLUMN seats.concert_id IS '콘서트 ID (외래키)';
COMMENT ON COLUMN seats.section IS '좌석 구역 (A, B, C, D)';
COMMENT ON COLUMN seats.row IS '좌석 열 번호 (1-20)';
COMMENT ON COLUMN seats.number IS '좌석 번호 (1-4)';
COMMENT ON COLUMN seats.grade IS '좌석 등급 (Special: 1-3열, Premium: 4-7열, Advanced: 8-15열, Regular: 16-20열)';
COMMENT ON COLUMN seats.price IS '좌석 가격 (원 단위)';
COMMENT ON COLUMN seats.status IS '좌석 상태 (available: 예약가능, reserved: 예약완료)';
COMMENT ON COLUMN seats.created_at IS '생성 일시';
COMMENT ON COLUMN seats.updated_at IS '수정 일시';

-- 인덱스 생성 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_seats_concert_id ON seats(concert_id);
CREATE INDEX IF NOT EXISTS idx_seats_concert_status ON seats(concert_id, status);
CREATE INDEX IF NOT EXISTS idx_seats_concert_grade ON seats(concert_id, grade);
CREATE INDEX IF NOT EXISTS idx_seats_position ON seats(concert_id, section, row, number);

-- updated_at 자동 업데이트 트리거 생성
DROP TRIGGER IF EXISTS update_seats_updated_at ON seats;
CREATE TRIGGER update_seats_updated_at
    BEFORE UPDATE ON seats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화
ALTER TABLE seats DISABLE ROW LEVEL SECURITY;

-- 좌석 등급별 가격 정책 참고
-- Special (1-3열): 250,000원
-- Premium (4-7열): 190,000원
-- Advanced (8-15열): 170,000원
-- Regular (16-20열): 140,000원