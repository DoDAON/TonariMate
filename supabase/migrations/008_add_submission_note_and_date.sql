-- 008: mission_submissions에 메모(note)와 수행 날짜(completed_at) 컬럼 추가
-- 실행: Supabase Dashboard > SQL Editor에서 실행

ALTER TABLE mission_submissions
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS completed_at DATE;
