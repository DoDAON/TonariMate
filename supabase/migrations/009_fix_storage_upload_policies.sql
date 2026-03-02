-- 009: Storage 업로드 정책 수정
-- 기존 팀 기반 경로 파싱(foldername()[3])이 경로 구조에 따라 오작동하는 문제 수정.
-- meeting_id(foldername()[1])를 기반으로 모임 멤버인지만 확인하는 단순한 정책으로 교체.
-- 팀 멤버 검증은 mission_submissions INSERT RLS가 담당.
--
-- 실행: Supabase Dashboard > SQL Editor에서 실행

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Team members can upload mission images" ON storage.objects;
DROP POLICY IF EXISTS "Team members can update mission images" ON storage.objects;

-- INSERT: 모임 멤버이면 업로드 허용
CREATE POLICY "Meeting members can upload mission images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mission-images'
  AND EXISTS (
    SELECT 1 FROM public.meeting_members mm
    WHERE mm.user_id = (SELECT auth.uid())
      AND mm.meeting_id::text = (storage.foldername(name))[1]
  )
);

-- UPDATE: 모임 멤버이면 덮어쓰기 허용 (재제출 시)
CREATE POLICY "Meeting members can update mission images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'mission-images'
  AND EXISTS (
    SELECT 1 FROM public.meeting_members mm
    WHERE mm.user_id = (SELECT auth.uid())
      AND mm.meeting_id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'mission-images'
  AND EXISTS (
    SELECT 1 FROM public.meeting_members mm
    WHERE mm.user_id = (SELECT auth.uid())
      AND mm.meeting_id::text = (storage.foldername(name))[1]
  )
);
