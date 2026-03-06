-- ============================================================
-- TonariMate — Storage 버킷 및 RLS 정책
-- ============================================================

-- ------------------------------------------------------------
-- 버킷 생성
-- ------------------------------------------------------------

-- 미션 인증 이미지 (공개 버킷)
-- 경로 구조: {meeting_id}/{mission_id}/{filename}
INSERT INTO storage.buckets (id, name, public)
VALUES ('mission-images', 'mission-images', true)
ON CONFLICT (id) DO NOTHING;

-- 프로필 아바타 (공개 버킷)
-- 경로 구조: {userId}/{filename}
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- mission-images 정책
-- ------------------------------------------------------------

-- SELECT: 모임 멤버가 조회 가능
CREATE POLICY "Meeting members can view mission images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'mission-images'
  AND EXISTS (
    SELECT 1 FROM public.meeting_members mm
    WHERE mm.user_id = (SELECT auth.uid())
      AND mm.meeting_id::text = (storage.foldername(name))[1]
  )
);

-- INSERT: 모임 멤버이면 업로드 가능
-- (팀 멤버 검증은 mission_submissions INSERT RLS에서 담당)
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

-- UPDATE: 모임 멤버이면 덮어쓰기 가능 (재제출 시)
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

-- DELETE: 글로벌 어드민만 삭제 가능
CREATE POLICY "Meeting admins can delete mission images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'mission-images'
  AND public.is_global_admin()
);

-- ------------------------------------------------------------
-- avatars 정책
-- ------------------------------------------------------------

-- SELECT: 누구나 조회 가능 (공개 버킷)
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- INSERT: 본인 폴더에만 업로드 가능
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- UPDATE: 본인 폴더만 덮어쓰기 가능
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- DELETE: 본인 폴더만 삭제 가능
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
