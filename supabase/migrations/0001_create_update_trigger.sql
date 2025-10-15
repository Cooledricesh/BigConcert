-- 0001_create_update_trigger.sql
-- updated_at 컬럼을 자동으로 업데이트하는 트리거 함수

-- 트리거 함수 생성 (이미 존재하면 교체)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 함수 설명 추가
COMMENT ON FUNCTION update_updated_at_column() IS
'모든 테이블의 updated_at 컬럼을 자동으로 현재 시간으로 업데이트하는 트리거 함수';