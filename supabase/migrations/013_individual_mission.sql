-- ============================================================
-- 개인 미션 유형 추가
-- ============================================================

-- 1. mission_type enum에 'individual' 추가
ALTER TYPE mission_type ADD VALUE IF NOT EXISTS 'individual';

-- 2. mission_submissions 유니크 제약 변경
--    기존: UNIQUE(mission_id, team_id) — 조당 1회 제출
--    신규: UNIQUE(mission_id, team_id, submitted_by) — 조원 별 1회 제출
--    (일반/조이름 미션은 앱 레이어에서 조 중복 제출 방지)
ALTER TABLE mission_submissions
  DROP CONSTRAINT IF EXISTS mission_submissions_mission_id_team_id_key;

ALTER TABLE mission_submissions
  ADD CONSTRAINT mission_submissions_mission_id_team_id_user_key
  UNIQUE (mission_id, team_id, submitted_by);

-- 3. points 테이블에 submission_id 추가
--    개인 미션: submission 삭제 시 CASCADE로 포인트 자동 삭제
ALTER TABLE points
  ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES mission_submissions(id) ON DELETE CASCADE;
