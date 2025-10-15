-- 0002_create_concerts_table.sql
-- 콘서트 정보를 저장하는 마스터 테이블

-- 테이블 생성
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

-- 테이블 설명
COMMENT ON TABLE concerts IS '콘서트 기본 정보를 저장하는 마스터 테이블';
COMMENT ON COLUMN concerts.id IS '콘서트 고유 식별자';
COMMENT ON COLUMN concerts.title IS '콘서트 제목';
COMMENT ON COLUMN concerts.artist IS '공연 아티스트명';
COMMENT ON COLUMN concerts.venue IS '공연 장소';
COMMENT ON COLUMN concerts.date IS '공연 일시';
COMMENT ON COLUMN concerts.poster_image IS '포스터 이미지 URL';
COMMENT ON COLUMN concerts.description IS '공연 상세 설명';
COMMENT ON COLUMN concerts.created_at IS '생성 일시';
COMMENT ON COLUMN concerts.updated_at IS '수정 일시';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_concerts_date ON concerts(date);
CREATE INDEX IF NOT EXISTS idx_concerts_created_at ON concerts(created_at DESC);

-- updated_at 자동 업데이트 트리거 생성
DROP TRIGGER IF EXISTS update_concerts_updated_at ON concerts;
CREATE TRIGGER update_concerts_updated_at
    BEFORE UPDATE ON concerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화
ALTER TABLE concerts DISABLE ROW LEVEL SECURITY;