-- 004_features.sql
-- Run in Supabase Dashboard > SQL Editor

-- 1. missions 테이블: 미션 종류 컬럼 추가
CREATE TYPE mission_type AS ENUM ('weekly', 'team_naming');
ALTER TABLE missions ADD COLUMN mission_type mission_type NOT NULL DEFAULT 'weekly';

-- 2. mission_submissions: 텍스트 제출 지원 (조 이름 정하기용)
ALTER TABLE mission_submissions ALTER COLUMN image_url DROP NOT NULL;
ALTER TABLE mission_submissions ADD COLUMN text_content TEXT;

-- 3. 데일리 미션 제출 테이블
CREATE TABLE daily_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id     UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  team_id        UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  submitted_by   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submitted_date DATE NOT NULL DEFAULT CURRENT_DATE,
  week_start     DATE NOT NULL,        -- 제출일이 속한 주의 월요일
  image_url      TEXT NOT NULL,        -- 제출 이미지 (주간 미션과 동일한 형식)
  completed_at   DATE,                 -- 수행 날짜
  note           TEXT,                 -- 메모 (선택)
  status         submission_status NOT NULL DEFAULT 'pending',
  reviewed_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at    TIMESTAMPTZ,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, submitted_by, submitted_date)  -- 하루 1회 제한
);
CREATE INDEX idx_daily_sub_meeting ON daily_submissions(meeting_id);
CREATE INDEX idx_daily_sub_week    ON daily_submissions(meeting_id, week_start);

-- 4. 공지사항 테이블
CREATE TABLE announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_announcements_meeting ON announcements(meeting_id, created_at DESC);

-- 5. PWA 푸시 구독 테이블
CREATE TABLE push_subscriptions (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint  TEXT NOT NULL,
  p256dh    TEXT NOT NULL,
  auth      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
