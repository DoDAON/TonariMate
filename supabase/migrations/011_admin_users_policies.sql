-- 011: 글로벌 관리자(role='admin')용 users 테이블 관리 정책
-- 자기참조 RLS 재귀 방지를 위해 SECURITY DEFINER 헬퍼 함수 사용
-- Supabase Dashboard > SQL Editor에서 실행

-- 1. is_global_admin() 헬퍼 함수 (SECURITY DEFINER로 재귀 방지)
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

-- 2. 관리자가 모든 유저 UPDATE 가능 (역할 변경 등)
CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  TO authenticated
  USING (public.is_global_admin())
  WITH CHECK (public.is_global_admin());

-- 3. 관리자가 유저 DELETE 가능 (회원탈퇴)
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (public.is_global_admin());

-- 4. 관리자가 team_members DELETE 가능
--    (회원탈퇴 시 users 삭제 전에 team_members 수동 삭제 필요)
CREATE POLICY "Global admins can delete any team member"
  ON team_members FOR DELETE
  TO authenticated
  USING (public.is_global_admin());

-- 5. 관리자가 meeting_members DELETE 가능
CREATE POLICY "Global admins can delete any meeting member"
  ON meeting_members FOR DELETE
  TO authenticated
  USING (public.is_global_admin());
