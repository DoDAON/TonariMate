-- Fix: meeting_members RLS 무한 재귀 해결 (42P17)
-- 원인: meeting_members 정책이 자기 테이블을 subquery로 참조하여 무한 재귀 발생
-- 해결: SECURITY DEFINER 헬퍼 함수로 RLS 우회하여 재귀 차단
--
-- 실행: Supabase Dashboard > SQL Editor에서 실행

-- 1. 헬퍼 함수 생성 (SECURITY DEFINER = RLS 우회)
CREATE OR REPLACE FUNCTION is_meeting_member(p_meeting_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM meeting_members
    WHERE meeting_id = p_meeting_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_meeting_admin(p_meeting_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM meeting_members
    WHERE meeting_id = p_meeting_id AND user_id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. 기존 자기참조 정책 삭제
DROP POLICY IF EXISTS "Members can view meeting members" ON meeting_members;
DROP POLICY IF EXISTS "Admins can manage meeting members" ON meeting_members;

-- 3. 헬퍼 함수를 사용하는 정책으로 재생성
CREATE POLICY "Members can view meeting members"
  ON meeting_members FOR SELECT
  TO authenticated
  USING (is_meeting_member(meeting_id));

CREATE POLICY "Admins can manage meeting members"
  ON meeting_members FOR ALL
  TO authenticated
  USING (is_meeting_admin(meeting_id));
