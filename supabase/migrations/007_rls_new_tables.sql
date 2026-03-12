-- 007_rls_new_tables.sql
-- announcements, daily_submissions, push_subscriptions 테이블 RLS 정책

-- ============================================================
-- announcements
-- ============================================================
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meeting members can view announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.meeting_members mm
    WHERE mm.meeting_id = announcements.meeting_id
      AND mm.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Admins can insert announcements"
ON public.announcements FOR INSERT
TO authenticated
WITH CHECK (public.is_global_admin());

CREATE POLICY "Admins can update announcements"
ON public.announcements FOR UPDATE
TO authenticated
USING (public.is_global_admin())
WITH CHECK (public.is_global_admin());

CREATE POLICY "Admins can delete announcements"
ON public.announcements FOR DELETE
TO authenticated
USING (public.is_global_admin());

-- ============================================================
-- daily_submissions
-- ============================================================
ALTER TABLE public.daily_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meeting members can view daily submissions"
ON public.daily_submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.meeting_members mm
    WHERE mm.meeting_id = daily_submissions.meeting_id
      AND mm.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Meeting members can submit daily missions"
ON public.daily_submissions FOR INSERT
TO authenticated
WITH CHECK (
  submitted_by = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.meeting_members mm
    WHERE mm.meeting_id = daily_submissions.meeting_id
      AND mm.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Admins can update daily submissions"
ON public.daily_submissions FOR UPDATE
TO authenticated
USING (public.is_global_admin())
WITH CHECK (public.is_global_admin());

CREATE POLICY "Admins can delete daily submissions"
ON public.daily_submissions FOR DELETE
TO authenticated
USING (public.is_global_admin());

-- ============================================================
-- push_subscriptions
-- ============================================================
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions"
ON public.push_subscriptions FOR ALL
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));
