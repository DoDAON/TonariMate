-- 005_storage_daily.sql
-- mission-images 버킷에 daily/ 경로 RLS 정책 추가
-- 경로 구조: daily/{meetingId}/{userId}/{date}/image.{ext}
--   foldername(name)[1] = 'daily'
--   foldername(name)[2] = meetingId
--   foldername(name)[3] = userId (업로더)

-- SELECT: 해당 모임 멤버가 조회 가능
CREATE POLICY "Meeting members can view daily images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'mission-images'
  AND (storage.foldername(name))[1] = 'daily'
  AND EXISTS (
    SELECT 1 FROM public.meeting_members mm
    WHERE mm.user_id = (SELECT auth.uid())
      AND mm.meeting_id::text = (storage.foldername(name))[2]
  )
);

-- INSERT: 해당 모임 멤버이며 본인 폴더에만 업로드 가능
CREATE POLICY "Meeting members can upload daily images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mission-images'
  AND (storage.foldername(name))[1] = 'daily'
  AND (storage.foldername(name))[3] = (SELECT auth.uid()::text)
  AND EXISTS (
    SELECT 1 FROM public.meeting_members mm
    WHERE mm.user_id = (SELECT auth.uid())
      AND mm.meeting_id::text = (storage.foldername(name))[2]
  )
);

-- UPDATE: INSERT와 동일 조건 (upsert 지원)
CREATE POLICY "Meeting members can update daily images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'mission-images'
  AND (storage.foldername(name))[1] = 'daily'
  AND (storage.foldername(name))[3] = (SELECT auth.uid()::text)
  AND EXISTS (
    SELECT 1 FROM public.meeting_members mm
    WHERE mm.user_id = (SELECT auth.uid())
      AND mm.meeting_id::text = (storage.foldername(name))[2]
  )
)
WITH CHECK (
  bucket_id = 'mission-images'
  AND (storage.foldername(name))[1] = 'daily'
  AND (storage.foldername(name))[3] = (SELECT auth.uid()::text)
  AND EXISTS (
    SELECT 1 FROM public.meeting_members mm
    WHERE mm.user_id = (SELECT auth.uid())
      AND mm.meeting_id::text = (storage.foldername(name))[2]
  )
);

-- DELETE: 글로벌 어드민만 삭제 가능
CREATE POLICY "Admins can delete daily images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'mission-images'
  AND (storage.foldername(name))[1] = 'daily'
  AND public.is_global_admin()
);
