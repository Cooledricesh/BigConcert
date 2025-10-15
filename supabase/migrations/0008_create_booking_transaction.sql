-- 예약 트랜잭션을 처리하는 Database Function
-- 좌석 선택, 중복 예약 확인, 예약 생성을 원자적으로 처리

CREATE OR REPLACE FUNCTION create_booking_transaction(
  p_concert_id UUID,
  p_seat_ids UUID[],
  p_user_name TEXT,
  p_user_phone TEXT,
  p_password_hash TEXT,
  p_total_price INTEGER
)
RETURNS TABLE (
  booking_id UUID,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking_id UUID;
  v_created_at TIMESTAMP WITH TIME ZONE;
  v_available_count INTEGER;
  v_duplicate_count INTEGER;
  v_seat_record RECORD;
BEGIN
  -- 1. 좌석 가용성 확인 및 Lock
  -- FOR UPDATE를 사용하여 선택한 좌석을 잠금
  -- 먼저 좌석을 잠그고, 그 결과를 카운트
  v_available_count := 0;

  FOR v_seat_record IN
    SELECT id
    FROM seats
    WHERE id = ANY(p_seat_ids)
      AND concert_id = p_concert_id
      AND status = 'available'
    FOR UPDATE
  LOOP
    v_available_count := v_available_count + 1;
  END LOOP;

  -- 요청한 좌석 수와 사용 가능한 좌석 수가 다르면 에러
  IF v_available_count != array_length(p_seat_ids, 1) THEN
    RAISE EXCEPTION 'SEAT_ALREADY_RESERVED: Some seats are already reserved';
  END IF;

  -- 2. 중복 예약 확인
  -- 동일한 전화번호로 같은 콘서트를 이미 예약했는지 확인
  SELECT COUNT(*)
  INTO v_duplicate_count
  FROM bookings
  WHERE user_phone = p_user_phone
    AND concert_id = p_concert_id
    AND status = 'confirmed';

  IF v_duplicate_count > 0 THEN
    RAISE EXCEPTION 'DUPLICATE_BOOKING: User has already booked this concert';
  END IF;

  -- 3. 예약 생성
  INSERT INTO bookings (
    concert_id,
    user_name,
    user_phone,
    password_hash,
    total_price,
    status
  )
  VALUES (
    p_concert_id,
    p_user_name,
    p_user_phone,
    p_password_hash,
    p_total_price,
    'confirmed'
  )
  RETURNING id, bookings.created_at INTO v_booking_id, v_created_at;

  -- 4. 예약-좌석 매핑
  INSERT INTO booking_seats (booking_id, seat_id)
  SELECT v_booking_id, unnest(p_seat_ids);

  -- 5. 좌석 상태 업데이트
  UPDATE seats
  SET status = 'reserved',
      updated_at = NOW()
  WHERE id = ANY(p_seat_ids);

  -- 6. 결과 반환
  RETURN QUERY SELECT v_booking_id, v_created_at;

EXCEPTION
  WHEN OTHERS THEN
    -- 에러 발생 시 자동으로 롤백되고 에러를 다시 발생시킴
    RAISE;
END;
$$;

-- 좌석 정보를 조회하는 함수 (트랜잭션과 별도로 사용)
CREATE OR REPLACE FUNCTION get_seats_for_booking(
  p_seat_ids UUID[]
)
RETURNS TABLE (
  id UUID,
  section TEXT,
  "row" INTEGER,
  "number" INTEGER,
  grade TEXT,
  price INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.section,
    s."row",
    s."number",
    s.grade,
    s.price
  FROM seats s
  WHERE s.id = ANY(p_seat_ids)
  ORDER BY s.section, s."row", s."number";
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION create_booking_transaction TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_seats_for_booking TO anon, authenticated;