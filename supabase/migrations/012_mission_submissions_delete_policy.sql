-- 012: mission_submissions DELETE 정책 추가
-- 기존에 UPDATE만 있고 DELETE 정책이 없어서 제출물 삭제가 RLS에 의해 차단됨
-- Supabase Dashboard > SQL Editor에서 실행

-- 모임 어드민(meeting 단위)이 제출물 삭제 가능
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

-- 글로벌 어드민도 삭제 가능
CREATE POLICY "Global admins can delete submissions"
  ON mission_submissions FOR DELETE
  TO authenticated
  USING (public.is_global_admin());
