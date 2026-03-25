-- 011_daily_rejection_reason.sql
-- daily_submissions 테이블에 rejection_reason 컬럼 추가

ALTER TABLE daily_submissions
ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;
