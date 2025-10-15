-- 0004_create_bookings_table.sql
-- 예약 마스터 정보

-- 테이블 생성
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concert_id UUID NOT NULL,
    user_name TEXT NOT NULL,                 -- 예약자명
    user_phone TEXT NOT NULL,                -- 전화번호
    password_hash TEXT NOT NULL,             -- 비밀번호 해시 (4자리)
    total_price INTEGER NOT NULL,            -- 총 금액
    status TEXT NOT NULL DEFAULT 'confirmed', -- 상태: confirmed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 외래키 제약조건
    CONSTRAINT fk_bookings_concert
        FOREIGN KEY (concert_id)
        REFERENCES concerts(id)
        ON DELETE CASCADE,

    -- 데이터 유효성 검증 제약조건
    CONSTRAINT bookings_status_check
        CHECK (status IN ('confirmed', 'cancelled')),
    CONSTRAINT bookings_user_name_check
        CHECK (length(trim(user_name)) > 0),
    CONSTRAINT bookings_user_phone_check
        CHECK (length(user_phone) >= 10),
    CONSTRAINT bookings_total_price_check
        CHECK (total_price > 0)
);

-- 테이블 설명
COMMENT ON TABLE bookings IS '예약 마스터 정보';
COMMENT ON COLUMN bookings.id IS '예약 고유 식별자';
COMMENT ON COLUMN bookings.concert_id IS '콘서트 ID (외래키)';
COMMENT ON COLUMN bookings.user_name IS '예약자 이름';
COMMENT ON COLUMN bookings.user_phone IS '예약자 전화번호';
COMMENT ON COLUMN bookings.password_hash IS '예약 조회용 비밀번호 해시 (4자리 숫자)';
COMMENT ON COLUMN bookings.total_price IS '총 예약 금액 (원 단위)';
COMMENT ON COLUMN bookings.status IS '예약 상태 (confirmed: 확정, cancelled: 취소)';
COMMENT ON COLUMN bookings.created_at IS '예약 생성 일시';
COMMENT ON COLUMN bookings.updated_at IS '예약 수정 일시';

-- 인덱스 생성 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_bookings_user_phone ON bookings(user_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_concert_id ON bookings(concert_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_phone_status ON bookings(user_phone, status);

-- updated_at 자동 업데이트 트리거 생성
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;