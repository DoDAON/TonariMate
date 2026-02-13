-- Fix: 모든 RLS 정책에서 meeting_members 직접 subquery를 헬퍼 함수로 통일
-- is_meeting_member(), is_meeting_admin()은 SECURITY DEFINER로 RLS 우회하므로
-- 재귀 방지 + 성능 개선 + 일관성 확보
--
-- 실행: Supabase Dashboard > SQL Editor에서 실행

-- ============================================================
-- 1. meetings 정책 — admin 판별을 users.role 대신 meeting 기반으로 유지
--    (global admin OR created_by 조건은 meeting_members와 무관하므로 그대로 둠)
-- ============================================================
-- meetings 정책은 meeting_members를 참조하지 않으므로 변경 불필요

-- ============================================================
-- 2. teams 정책
-- ============================================================
DROP POLICY IF EXISTS "Meeting members can view teams" ON teams;
DROP POLICY IF EXISTS "Meeting admins can manage teams" ON teams;

CREATE POLICY "Meeting members can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (is_meeting_member(meeting_id));

CREATE POLICY "Meeting admins can manage teams"
  ON teams FOR ALL
  TO authenticated
  USING (is_meeting_admin(meeting_id));

-- ============================================================
-- 3. team_members 정책
-- ============================================================
DROP POLICY IF EXISTS "Team members can view team members" ON team_members;
DROP POLICY IF EXISTS "Meeting admins can manage team members" ON team_members;

CREATE POLICY "Team members can view team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id
      AND is_meeting_member(t.meeting_id)
    )
  );

CREATE POLICY "Meeting admins can manage team members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id
      AND is_meeting_admin(t.meeting_id)
    )
  );

-- ============================================================
-- 4. missions 정책
-- ============================================================
DROP POLICY IF EXISTS "Meeting members can view missions" ON missions;
DROP POLICY IF EXISTS "Meeting admins can manage missions" ON missions;

CREATE POLICY "Meeting members can view missions"
  ON missions FOR SELECT
  TO authenticated
  USING (is_meeting_member(meeting_id));

CREATE POLICY "Meeting admins can manage missions"
  ON missions FOR ALL
  TO authenticated
  USING (is_meeting_admin(meeting_id));

-- ============================================================
-- 5. mission_submissions 정책
-- ============================================================
DROP POLICY IF EXISTS "Team members can view their submissions" ON mission_submissions;
DROP POLICY IF EXISTS "Meeting admins can manage submissions" ON mission_submissions;

CREATE POLICY "Team members can view their submissions"
  ON mission_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = mission_submissions.team_id
      AND tm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM missions m
      WHERE m.id = mission_submissions.mission_id
      AND is_meeting_admin(m.meeting_id)
    )
  );

CREATE POLICY "Meeting admins can manage submissions"
  ON mission_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM missions m
      WHERE m.id = mission_submissions.mission_id
      AND is_meeting_admin(m.meeting_id)
    )
  );

-- ============================================================
-- 6. points 정책
-- ============================================================
DROP POLICY IF EXISTS "Team members can view points" ON points;
DROP POLICY IF EXISTS "Meeting admins can manage points" ON points;

CREATE POLICY "Team members can view points"
  ON points FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = points.team_id
      AND is_meeting_member(t.meeting_id)
    )
  );

CREATE POLICY "Meeting admins can manage points"
  ON points FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = points.team_id
      AND is_meeting_admin(t.meeting_id)
    )
  );
