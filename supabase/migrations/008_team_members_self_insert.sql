-- 팀 지정 초대 링크를 통한 자기 배정 허용
-- 조건: 1) 자기 자신만 삽입 가능  2) 해당 모임의 멤버여야 함  3) 그 모임에서 아직 팀 미배정 상태여야 함

CREATE POLICY "team_members_self_insert_via_invite" ON team_members
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND is_meeting_member(
      (SELECT meeting_id FROM teams WHERE id = team_id)
    )
    AND NOT EXISTS (
      SELECT 1 FROM team_members tm2
      JOIN teams t ON tm2.team_id = t.id
      WHERE tm2.user_id = auth.uid()
        AND t.meeting_id = (SELECT meeting_id FROM teams WHERE id = team_id)
    )
  );
