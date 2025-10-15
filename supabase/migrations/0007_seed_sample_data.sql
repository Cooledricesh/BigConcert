-- 0007_seed_sample_data.sql
-- 개발 및 테스트용 샘플 데이터

-- ========================================
-- 샘플 콘서트 데이터 추가
-- ========================================

DO $$
DECLARE
    v_concert1_id UUID;
    v_concert2_id UUID;
    v_concert3_id UUID;
    v_concert4_id UUID;
    v_concert5_id UUID;
    v_current_concert_id UUID;
    v_current_section TEXT;
    v_row_num INTEGER;
    v_seat_num INTEGER;
    v_sample_booking_id UUID;
    v_seat1_id UUID;
    v_seat2_id UUID;
BEGIN
    -- 콘서트 1: IU 콘서트 (2주 후)
    INSERT INTO concerts (title, artist, venue, date, poster_image, description)
    VALUES (
        'IU - The Golden Hour',
        'IU (아이유)',
        '올림픽공원 체조경기장',
        NOW() + INTERVAL '14 days',
        'https://picsum.photos/400/600?random=1',
        '아이유의 특별한 골든 아워 콘서트. 히트곡 메들리와 신곡 무대까지 다채로운 구성으로 팬들을 찾아갑니다.'
    ) RETURNING id INTO v_concert1_id;

    -- 콘서트 2: 뉴진스 콘서트 (1개월 후)
    INSERT INTO concerts (title, artist, venue, date, poster_image, description)
    VALUES (
        'NewJeans - Bunnies Camp 2025',
        'NewJeans',
        '고척스카이돔',
        NOW() + INTERVAL '30 days',
        'https://picsum.photos/400/600?random=2',
        '뉴진스와 버니즈가 함께하는 특별한 팬미팅 콘서트. Y2K 감성 가득한 무대와 깜짝 이벤트가 준비되어 있습니다.'
    ) RETURNING id INTO v_concert2_id;

    -- 콘서트 3: 세븐틴 콘서트 (45일 후)
    INSERT INTO concerts (title, artist, venue, date, poster_image, description)
    VALUES (
        'SEVENTEEN - Follow to Seoul',
        'SEVENTEEN',
        '고척스카이돔',
        NOW() + INTERVAL '45 days',
        'https://picsum.photos/400/600?random=3',
        '세븐틴 월드투어 서울 공연. 완벽한 칼군무와 라이브, 13명의 에너지가 폭발하는 무대를 만나보세요.'
    ) RETURNING id INTO v_concert3_id;

    -- 콘서트 4: 임영웅 콘서트 (2개월 후)
    INSERT INTO concerts (title, artist, venue, date, poster_image, description)
    VALUES (
        '임영웅 - IM HERO',
        '임영웅',
        '잠실실내체육관',
        NOW() + INTERVAL '60 days',
        'https://picsum.photos/400/600?random=4',
        '전 세대를 아우르는 국민가수 임영웅의 단독 콘서트. 감동과 위로의 무대로 여러분을 초대합니다.'
    ) RETURNING id INTO v_concert4_id;

    -- 콘서트 5: 에스파 콘서트 (75일 후)
    INSERT INTO concerts (title, artist, venue, date, poster_image, description)
    VALUES (
        'aespa - SYNK : PARALLEL LINE',
        'aespa',
        '올림픽공원 KSPO DOME',
        NOW() + INTERVAL '75 days',
        'https://picsum.photos/400/600?random=5',
        '메타버스 세계관과 현실이 만나는 에스파의 혁신적인 콘서트. 광야에서 펼쳐지는 환상적인 퍼포먼스를 경험하세요.'
    ) RETURNING id INTO v_concert5_id;

    -- ========================================
    -- 각 콘서트별 좌석 데이터 생성 (320석씩)
    -- ========================================

    -- 콘서트별로 좌석 생성
    FOR v_current_concert_id IN
        SELECT unnest(ARRAY[v_concert1_id, v_concert2_id, v_concert3_id, v_concert4_id, v_concert5_id])
    LOOP
        -- 각 구역(A,B,C,D)별로 좌석 생성
        FOR v_current_section IN
            SELECT unnest(ARRAY['A', 'B', 'C', 'D'])
        LOOP
            -- 각 열(1-20)별로 좌석 생성
            FOR v_row_num IN 1..20
            LOOP
                -- 각 좌석 번호(1-4)별로 좌석 생성
                FOR v_seat_num IN 1..4
                LOOP
                    INSERT INTO seats (concert_id, section, row, number, grade, price, status)
                    VALUES (
                        v_current_concert_id,
                        v_current_section,
                        v_row_num,
                        v_seat_num,
                        -- 등급 결정 (열 번호에 따라)
                        CASE
                            WHEN v_row_num BETWEEN 1 AND 3 THEN 'Special'
                            WHEN v_row_num BETWEEN 4 AND 7 THEN 'Premium'
                            WHEN v_row_num BETWEEN 8 AND 15 THEN 'Advanced'
                            ELSE 'Regular'
                        END,
                        -- 가격 결정 (등급에 따라)
                        CASE
                            WHEN v_row_num BETWEEN 1 AND 3 THEN 250000
                            WHEN v_row_num BETWEEN 4 AND 7 THEN 190000
                            WHEN v_row_num BETWEEN 8 AND 15 THEN 170000
                            ELSE 140000
                        END,
                        -- 일부 좌석은 이미 예약된 상태로 설정 (랜덤하게 약 20%)
                        CASE
                            WHEN random() < 0.2 THEN 'reserved'
                            ELSE 'available'
                        END
                    );
                END LOOP;
            END LOOP;
        END LOOP;
    END LOOP;

    -- ========================================
    -- 샘플 예약 데이터 추가 (테스트용)
    -- ========================================

    -- IU 콘서트에 대한 샘플 예약 생성
    SELECT id INTO v_seat1_id FROM seats
    WHERE concert_id = v_concert1_id
    AND section = 'A' AND row = 5 AND number = 2
    AND status = 'available'
    LIMIT 1;

    SELECT id INTO v_seat2_id FROM seats
    WHERE concert_id = v_concert1_id
    AND section = 'A' AND row = 5 AND number = 3
    AND status = 'available'
    LIMIT 1;

    IF v_seat1_id IS NOT NULL AND v_seat2_id IS NOT NULL THEN
        -- 예약 생성
        INSERT INTO bookings (concert_id, user_name, user_phone, password_hash, total_price, status)
        VALUES (
            v_concert1_id,
            '홍길동',
            '01012345678',
            -- 실제로는 bcrypt 등으로 해시해야 하지만, 샘플이므로 간단히 처리
            -- 비밀번호: 1234
            '$2a$10$YourHashedPasswordHere',
            380000, -- Premium 2장
            'confirmed'
        ) RETURNING id INTO v_sample_booking_id;

        -- 좌석 매핑
        INSERT INTO booking_seats (booking_id, seat_id)
        VALUES
            (v_sample_booking_id, v_seat1_id),
            (v_sample_booking_id, v_seat2_id);

        -- 좌석 상태 업데이트
        UPDATE seats SET status = 'reserved'
        WHERE id IN (v_seat1_id, v_seat2_id);
    END IF;
END $$;

-- ========================================
-- 데이터 검증
-- ========================================

-- 생성된 콘서트 수 확인
DO $$
DECLARE
    v_concert_count INTEGER;
    v_total_seats INTEGER;
    v_available_seats INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_concert_count FROM concerts;
    SELECT COUNT(*) INTO v_total_seats FROM seats;
    SELECT COUNT(*) INTO v_available_seats FROM seats WHERE status = 'available';

    RAISE NOTICE '샘플 데이터 생성 완료:';
    RAISE NOTICE '- 콘서트: % 개', v_concert_count;
    RAISE NOTICE '- 전체 좌석: % 개', v_total_seats;
    RAISE NOTICE '- 예약 가능 좌석: % 개', v_available_seats;
    RAISE NOTICE '- 예약된 좌석: % 개', v_total_seats - v_available_seats;
END $$;

-- 샘플 데이터 생성 완료 메시지
COMMENT ON SCHEMA public IS '샘플 데이터가 성공적으로 생성되었습니다. 개발 및 테스트에 사용하세요.';