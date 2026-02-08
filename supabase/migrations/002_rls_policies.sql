-- Row Level Security 정책
-- 실행: Supabase Dashboard > SQL Editor에서 001 이후 실행

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;

-- Users 정책
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Meetings 정책
CREATE POLICY "Anyone can view active meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage meetings"
  ON meetings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
    OR created_by = auth.uid()
  );

-- Meeting Members 정책
CREATE POLICY "Members can view meeting members"
  ON meeting_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meeting_members mm
      WHERE mm.meeting_id = meeting_members.meeting_id
      AND mm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join meetings"
  ON meeting_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage meeting members"
  ON meeting_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meeting_members mm
      WHERE mm.meeting_id = meeting_members.meeting_id
      AND mm.user_id = auth.uid()
      AND mm.role = 'admin'
    )
  );

-- Teams 정책
CREATE POLICY "Meeting members can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meeting_members mm
      WHERE mm.meeting_id = teams.meeting_id
      AND mm.user_id = auth.uid()
    )
  );

CREATE POLICY "Meeting admins can manage teams"
  ON teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meeting_members mm
      WHERE mm.meeting_id = teams.meeting_id
      AND mm.user_id = auth.uid()
      AND mm.role = 'admin'
    )
  );

-- Team Members 정책
CREATE POLICY "Team members can view team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN meeting_members mm ON mm.meeting_id = t.meeting_id
      WHERE t.id = team_members.team_id
      AND mm.user_id = auth.uid()
    )
  );

CREATE POLICY "Meeting admins can manage team members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN meeting_members mm ON mm.meeting_id = t.meeting_id
      WHERE t.id = team_members.team_id
      AND mm.user_id = auth.uid()
      AND mm.role = 'admin'
    )
  );

-- Missions 정책
CREATE POLICY "Meeting members can view missions"
  ON missions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meeting_members mm
      WHERE mm.meeting_id = missions.meeting_id
      AND mm.user_id = auth.uid()
    )
  );

CREATE POLICY "Meeting admins can manage missions"
  ON missions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meeting_members mm
      WHERE mm.meeting_id = missions.meeting_id
      AND mm.user_id = auth.uid()
      AND mm.role = 'admin'
    )
  );

-- Mission Submissions 정책
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
      JOIN meeting_members mm ON mm.meeting_id = m.meeting_id
      WHERE m.id = mission_submissions.mission_id
      AND mm.user_id = auth.uid()
      AND mm.role = 'admin'
    )
  );

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

CREATE POLICY "Meeting admins can manage submissions"
  ON mission_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM missions m
      JOIN meeting_members mm ON mm.meeting_id = m.meeting_id
      WHERE m.id = mission_submissions.mission_id
      AND mm.user_id = auth.uid()
      AND mm.role = 'admin'
    )
  );

-- Points 정책
CREATE POLICY "Team members can view points"
  ON points FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN meeting_members mm ON mm.meeting_id = t.meeting_id
      WHERE t.id = points.team_id
      AND mm.user_id = auth.uid()
    )
  );

CREATE POLICY "Meeting admins can manage points"
  ON points FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN meeting_members mm ON mm.meeting_id = t.meeting_id
      WHERE t.id = points.team_id
      AND mm.user_id = auth.uid()
      AND mm.role = 'admin'
    )
  );
