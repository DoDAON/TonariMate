-- Fix: is_meeting_admin()이 global admin(users.role = 'admin')을 인식하지 못하는 문제
-- 원인: 기존 함수는 meeting_members.role = 'admin'만 확인.
--       global admin은 meeting_members에 admin role로 등록되지 않아 RLS DELETE가 조용히 무시됨.
-- 해결: users.role = 'admin'도 허용하도록 OR 조건 추가.
--
-- 실행: Supabase Dashboard > SQL Editor에서 실행

CREATE OR REPLACE FUNCTION is_meeting_admin(p_meeting_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM meeting_members
    WHERE meeting_id = p_meeting_id AND user_id = auth.uid() AND role = 'admin'
  );
$$;
