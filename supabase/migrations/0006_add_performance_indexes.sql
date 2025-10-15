-- 0006_add_performance_indexes.sql
-- 성능 최적화를 위한 추가 인덱스

-- ========================================
-- 복합 인덱스 (Composite Indexes)
-- ========================================

-- 콘서트 목록 조회 시 성능 최적화
-- 날짜와 생성일 기준 정렬을 자주 수행 (날짜 필터링은 쿼리 시점에서 처리)
CREATE INDEX IF NOT EXISTS idx_concerts_date_created_at
    ON concerts(date, created_at DESC);

-- 등급별 가용 좌석 조회 최적화
-- 특정 콘서트의 등급별 available 좌석을 자주 조회
CREATE INDEX IF NOT EXISTS idx_seats_concert_grade_status
    ON seats(concert_id, grade, status)
    WHERE status = 'available';

-- 예약 조회 최적화
-- 전화번호로 확정된 예약 조회를 자주 수행
CREATE INDEX IF NOT EXISTS idx_bookings_phone_confirmed
    ON bookings(user_phone, created_at DESC)
    WHERE status = 'confirmed';

-- ========================================
-- 부분 인덱스 (Partial Indexes)
-- ========================================

-- 예약 가능한 좌석만 인덱싱 (reserved 좌석은 제외)
CREATE INDEX IF NOT EXISTS idx_seats_available_only
    ON seats(concert_id, section, row, number)
    WHERE status = 'available';

-- 확정된 예약만 인덱싱 (취소된 예약 제외)
CREATE INDEX IF NOT EXISTS idx_bookings_confirmed_only
    ON bookings(concert_id, created_at DESC)
    WHERE status = 'confirmed';

-- ========================================
-- 통계 정보 갱신
-- ========================================

-- 테이블 통계 정보를 수동으로 갱신 (옵션)
-- 실제 운영 시 자동으로 수행되지만, 초기 세팅 시 유용
ANALYZE concerts;
ANALYZE seats;
ANALYZE bookings;
ANALYZE booking_seats;

-- ========================================
-- 인덱스 설명 추가
-- ========================================

COMMENT ON INDEX idx_concerts_date_created_at IS '콘서트 목록 페이지네이션 최적화';
COMMENT ON INDEX idx_seats_concert_grade_status IS '등급별 좌석 현황 조회 최적화';
COMMENT ON INDEX idx_bookings_phone_confirmed IS '예약 조회 페이지 최적화';
COMMENT ON INDEX idx_seats_available_only IS '예약 가능 좌석 조회 최적화';
COMMENT ON INDEX idx_bookings_confirmed_only IS '확정 예약 통계 최적화';