-- Fix: 트리거 함수에 search_path 설정 추가
-- SECURITY DEFINER는 아니지만 Supabase Linter 경고 해소 + 보안 강화
--
-- 실행: Supabase Dashboard > SQL Editor에서 실행

ALTER FUNCTION public.update_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_team_points() SET search_path = public, pg_temp;
