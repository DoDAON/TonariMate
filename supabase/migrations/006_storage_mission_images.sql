-- 006: Storage 버킷 생성 및 RLS 정책 (Phase 3-2)
-- Supabase Dashboard > SQL Editor에서 실행

-- 1. mission-images 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('mission-images', 'mission-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS 정책

-- INSERT: 팀 멤버만 업로드 가능
-- 경로 구조: {meeting_id}/{mission_id}/{team_id}.{ext}
CREATE POLICY "Team members can upload mission images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mission-images'
  AND EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.teams t ON t.id = tm.team_id
    WHERE tm.user_id = (SELECT auth.uid())
      AND t.id::text = (storage.foldername(name))[3]
      AND t.meeting_id::text = (storage.foldername(name))[1]
  )
);

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

-- UPDATE: 팀 멤버만 덮어쓰기 가능
CREATE POLICY "Team members can update mission images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'mission-images'
  AND EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.teams t ON t.id = tm.team_id
    WHERE tm.user_id = (SELECT auth.uid())
      AND t.id::text = (storage.foldername(name))[3]
      AND t.meeting_id::text = (storage.foldername(name))[1]
  )
);
