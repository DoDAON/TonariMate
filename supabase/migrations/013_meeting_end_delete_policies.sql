-- 013: 모임 종료/삭제 관련 RLS 정책 수정
-- 1. 모임 멤버는 비활성 모임도 조회 가능하도록 정책 추가
-- 2. Storage 삭제 권한: 관리자가 mission-images 삭제 가능
-- Supabase Dashboard > SQL Editor에서 실행

-- 모임 멤버는 자신의 모임을 항상 조회 가능 (is_active 무관)
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

-- Storage: 관리자(meeting admin)가 mission-images 파일 삭제 가능
CREATE POLICY "Meeting admins can delete mission images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'mission-images'
    AND public.is_global_admin()
  );
