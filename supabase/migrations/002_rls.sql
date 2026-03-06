-- ============================================================
-- TonariMate — Row Level Security
-- 헬퍼 함수 + 전체 테이블 RLS 정책
-- ============================================================

-- ------------------------------------------------------------
-- RLS 활성화
-- ------------------------------------------------------------
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams              ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points             ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 헬퍼 함수 (SECURITY DEFINER — RLS 자기참조 재귀 방지)
-- ------------------------------------------------------------

-- 현재 유저가 해당 모임의 멤버인지 확인
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

-- 현재 유저가 해당 모임의 어드민인지 확인
-- (meeting_members.role = 'admin' OR users.role = 'admin')
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

-- 현재 유저가 글로벌 관리자인지 확인 (users.role = 'admin')
CREATE OR REPLACE FUNCTION is_global_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- users 정책
-- ------------------------------------------------------------

-- 인증된 유저는 모든 프로필 조회 가능
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- 본인 프로필만 INSERT 가능
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 본인 프로필 UPDATE 가능
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 글로벌 어드민은 모든 유저 UPDATE 가능 (역할 변경 등)
CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  TO authenticated
  USING (is_global_admin())
  WITH CHECK (is_global_admin());

-- 글로벌 어드민은 유저 DELETE 가능
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (is_global_admin());

-- ------------------------------------------------------------
-- meetings 정책
-- ------------------------------------------------------------

-- 활성화된 모임은 인증된 유저 누구나 조회 가능
CREATE POLICY "Anyone can view active meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 모임 멤버는 비활성 모임도 항상 조회 가능
CREATE POLICY "Meeting members can view their meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meeting_members mm
      WHERE mm.meeting_id = meetings.id
      AND mm.user_id = auth.uid()
    )
  );

-- 글로벌 어드민 또는 모임 생성자만 관리 가능
CREATE POLICY "Admins can manage meetings"
  ON meetings FOR ALL
  TO authenticated
  USING (
    is_global_admin()
    OR created_by = auth.uid()
  );

-- ------------------------------------------------------------
-- meeting_members 정책
-- ------------------------------------------------------------

-- 같은 모임 멤버끼리 조회 가능
CREATE POLICY "Members can view meeting members"
  ON meeting_members FOR SELECT
  TO authenticated
  USING (is_meeting_member(meeting_id));

-- 본인이 직접 참가 신청 가능
CREATE POLICY "Users can join meetings"
  ON meeting_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 모임 어드민이 멤버 관리 가능
CREATE POLICY "Admins can manage meeting members"
  ON meeting_members FOR ALL
  TO authenticated
  USING (is_meeting_admin(meeting_id));

-- 글로벌 어드민은 모든 모임 멤버 삭제 가능
CREATE POLICY "Global admins can delete any meeting member"
  ON meeting_members FOR DELETE
  TO authenticated
  USING (is_global_admin());

-- ------------------------------------------------------------
-- teams 정책
-- ------------------------------------------------------------

-- 모임 멤버는 해당 모임의 조 조회 가능
CREATE POLICY "Meeting members can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (is_meeting_member(meeting_id));

-- 모임 어드민이 조 관리 가능
CREATE POLICY "Meeting admins can manage teams"
  ON teams FOR ALL
  TO authenticated
  USING (is_meeting_admin(meeting_id));

-- ------------------------------------------------------------
-- team_members 정책
-- ------------------------------------------------------------

-- 같은 모임 멤버는 조원 목록 조회 가능
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

-- 모임 어드민이 조원 관리 가능
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

-- 글로벌 어드민은 모든 조원 삭제 가능
CREATE POLICY "Global admins can delete any team member"
  ON team_members FOR DELETE
  TO authenticated
  USING (is_global_admin());

-- ------------------------------------------------------------
-- missions 정책
-- ------------------------------------------------------------

-- 모임 멤버는 해당 모임의 미션 조회 가능
CREATE POLICY "Meeting members can view missions"
  ON missions FOR SELECT
  TO authenticated
  USING (is_meeting_member(meeting_id));

-- 모임 어드민이 미션 관리 가능
CREATE POLICY "Meeting admins can manage missions"
  ON missions FOR ALL
  TO authenticated
  USING (is_meeting_admin(meeting_id));

-- ------------------------------------------------------------
-- mission_submissions 정책
-- ------------------------------------------------------------

-- 조원 또는 모임 어드민이 제출물 조회 가능
CREATE POLICY "Team members can view their submissions"
  ON mission_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = mission_submissions.team_id
      AND tm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM missions m
      WHERE m.id = mission_submissions.mission_id
      AND is_meeting_admin(m.meeting_id)
    )
  );

-- 조원만 제출 가능 (submitted_by = 본인)
CREATE POLICY "Team members can submit"
  ON mission_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = mission_submissions.team_id
      AND tm.user_id = auth.uid()
    )
    AND submitted_by = auth.uid()
  );

-- 모임 어드민이 제출물 심사(UPDATE) 가능
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

-- 모임 어드민이 제출물 삭제 가능
CREATE POLICY "Meeting admins can delete submissions"
  ON mission_submissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM missions m
      WHERE m.id = mission_submissions.mission_id
      AND is_meeting_admin(m.meeting_id)
    )
  );

-- 글로벌 어드민도 제출물 삭제 가능
CREATE POLICY "Global admins can delete submissions"
  ON mission_submissions FOR DELETE
  TO authenticated
  USING (is_global_admin());

-- ------------------------------------------------------------
-- points 정책
-- ------------------------------------------------------------

-- 모임 멤버는 해당 모임의 포인트 조회 가능
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

-- 모임 어드민이 포인트 관리 가능
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
