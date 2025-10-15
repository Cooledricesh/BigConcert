-- 0005_create_booking_seats_table.sql
-- 예약과 좌석을 연결하는 매핑 테이블

-- 테이블 생성
CREATE TABLE IF NOT EXISTS booking_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL,
    seat_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 외래키 제약조건
    CONSTRAINT fk_booking_seats_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_booking_seats_seat
        FOREIGN KEY (seat_id)
        REFERENCES seats(id)
        ON DELETE CASCADE,

    -- 중복 방지 제약조건 (같은 좌석을 같은 예약에 두 번 매핑 방지)
    CONSTRAINT booking_seats_unique
        UNIQUE (booking_id, seat_id)
);

-- 테이블 설명
COMMENT ON TABLE booking_seats IS '예약과 좌석을 연결하는 매핑 테이블 (M:N 관계)';
COMMENT ON COLUMN booking_seats.id IS '매핑 고유 식별자';
COMMENT ON COLUMN booking_seats.booking_id IS '예약 ID (외래키)';
COMMENT ON COLUMN booking_seats.seat_id IS '좌석 ID (외래키)';
COMMENT ON COLUMN booking_seats.created_at IS '매핑 생성 일시';
COMMENT ON COLUMN booking_seats.updated_at IS '매핑 수정 일시';

-- 인덱스 생성 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_booking_seats_booking_id ON booking_seats(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_seats_seat_id ON booking_seats(seat_id);

-- updated_at 자동 업데이트 트리거 생성
DROP TRIGGER IF EXISTS update_booking_seats_updated_at ON booking_seats;
CREATE TRIGGER update_booking_seats_updated_at
    BEFORE UPDATE ON booking_seats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화
ALTER TABLE booking_seats DISABLE ROW LEVEL SECURITY;