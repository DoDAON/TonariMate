-- 008에서 추가한 team_members 자기삽입 RLS 정책 제거
-- NOT EXISTS가 team_members를 자기참조해 42P17 무한 재귀 유발
-- 팀 배정은 서비스 롤 클라이언트(lib/supabase/server.ts createServiceClient)로 처리하므로 불필요

DROP POLICY IF EXISTS "team_members_self_insert_via_invite" ON team_members;
