'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { getTodayStr, getWeekStart, getWeekEnd } from '@/lib/queries/daily-submissions';

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function submitDailyMission(
  meetingId: string,
  teamId: string,
  userId: string,
  imageUrl: string,
  completedAt: string,
  note?: string
): Promise<ActionResult> {
  if (!completedAt) {
    return { success: false, error: '수행 날짜를 입력해주세요' };
  }

  const supabase = await createClient();
  const today = getTodayStr();

  const { data: meeting } = await supabase
    .from('meetings')
    .select('start_date')
    .eq('id', meetingId)
    .single();

  if (meeting?.start_date && today < meeting.start_date) {
    return { success: false, error: '아직 데일리 미션 기간이 시작되지 않았습니다' };
  }

  // completedAt이 이번 주(KST 월~일) 범위인지 검증
  const weekStart = getWeekStart(today, meeting?.start_date);
  const weekEnd = getWeekEnd(weekStart);

  if (completedAt < weekStart || completedAt > weekEnd) {
    return { success: false, error: '이번 주(월~일) 날짜만 선택할 수 있습니다' };
  }

  // 미래 날짜 제출 금지
  if (completedAt > today) {
    return { success: false, error: '미래 날짜로 제출할 수 없습니다' };
  }

  // 해당 날짜 이미 제출 여부 확인
  const { data: existing } = await supabase
    .from('daily_submissions')
    .select('id')
    .eq('meeting_id', meetingId)
    .eq('submitted_by', userId)
    .eq('submitted_date', completedAt)
    .single();

  if (existing) {
    return { success: false, error: '해당 날짜에 이미 데일리 미션을 제출했습니다' };
  }

  // 이번 주 제출 횟수 확인 (rejected 제외)
  const { count } = await supabase
    .from('daily_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('meeting_id', meetingId)
    .eq('submitted_by', userId)
    .eq('week_start', weekStart)
    .neq('status', 'rejected');

  if ((count ?? 0) >= 5) {
    return { success: false, error: '이번 주 데일리 미션 제출 횟수(5회)를 초과했습니다' };
  }

  const { error } = await supabase.from('daily_submissions').insert({
    meeting_id: meetingId,
    team_id: teamId,
    submitted_by: userId,
    submitted_date: completedAt,
    week_start: weekStart,
    image_url: imageUrl,
    completed_at: completedAt,
    note: note?.trim() || null,
  });

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: '오늘 이미 데일리 미션을 제출했습니다' };
    }
    return { success: false, error: '제출에 실패했습니다. 다시 시도해주세요.' };
  }

  revalidatePath(ROUTES.MEETING(meetingId));
  revalidatePath(ROUTES.MEETING_DAILY(meetingId));

  return { success: true };
}

export async function reviewDailySubmission(
  submissionId: string,
  meetingId: string,
  reviewerId: string,
  action: 'approve' | 'reject'
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: submission, error: fetchError } = await supabase
    .from('daily_submissions')
    .select('id, team_id, status')
    .eq('id', submissionId)
    .single();

  if (fetchError || !submission) {
    return { success: false, error: '제출물을 찾을 수 없습니다' };
  }

  if (submission.status !== 'pending') {
    return { success: false, error: '이미 심사된 제출물입니다' };
  }

  if (action === 'approve') {
    const { error: updateError } = await supabase
      .from('daily_submissions')
      .update({
        status: 'approved',
        points_awarded: 3,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) {
      return { success: false, error: '승인 처리에 실패했습니다' };
    }

    // 포인트 지급
    const { error: pointsError } = await supabase.from('points').insert({
      team_id: submission.team_id,
      mission_id: null,
      amount: 3,
      reason: '데일리 미션 완료',
    });

    if (pointsError) {
      return { success: false, error: '포인트 부여에 실패했습니다' };
    }

    // total_points 재계산
    const { data: pts } = await supabase
      .from('points')
      .select('amount')
      .eq('team_id', submission.team_id);
    const total = pts?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
    await supabase.from('teams').update({ total_points: total }).eq('id', submission.team_id);
  } else {
    const { error: updateError } = await supabase
      .from('daily_submissions')
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) {
      return { success: false, error: '거절 처리에 실패했습니다' };
    }
  }

  revalidatePath(ROUTES.ADMIN_MEETING_DAILY(meetingId));

  return { success: true };
}

/**
 * 데일리 제출물 삭제 (롤백).
 * 승인된 경우 포인트 레코드도 1개 회수하고 total_points 재계산.
 */
export async function deleteDailySubmission(
  submissionId: string,
  meetingId: string
): Promise<ActionResult> {
  const supabase = createServiceClient();

  const { data: submission, error: fetchError } = await supabase
    .from('daily_submissions')
    .select('id, team_id, status, image_url')
    .eq('id', submissionId)
    .single();

  if (fetchError || !submission) {
    return { success: false, error: '제출물을 찾을 수 없습니다' };
  }

  // 승인된 경우 포인트 1건 회수
  if (submission.status === 'approved') {
    const { data: pointRecord } = await supabase
      .from('points')
      .select('id')
      .eq('team_id', submission.team_id)
      .is('mission_id', null)
      .eq('amount', 3)
      .eq('reason', '데일리 미션 완료')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (pointRecord) {
      await supabase.from('points').delete().eq('id', pointRecord.id);
    }

    // total_points 재계산
    const { data: pts } = await supabase
      .from('points')
      .select('amount')
      .eq('team_id', submission.team_id);
    const total = pts?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
    await supabase.from('teams').update({ total_points: total }).eq('id', submission.team_id);
  }

  // 스토리지 이미지 삭제 (best-effort)
  if (submission.image_url) {
    try {
      const marker = '/mission-images/';
      const idx = submission.image_url.indexOf(marker);
      if (idx !== -1) {
        const path = submission.image_url.slice(idx + marker.length);
        await supabase.storage.from('mission-images').remove([path]);
      }
    } catch {
      // 스토리지 삭제 실패해도 DB 삭제 계속 진행
    }
  }

  const { error } = await supabase
    .from('daily_submissions')
    .delete()
    .eq('id', submissionId);

  if (error) {
    return { success: false, error: '제출물 삭제에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING_DAILY(meetingId));
  revalidatePath(ROUTES.MEETING_DAILY(meetingId));
  revalidatePath(ROUTES.MEETING(meetingId));

  return { success: true };
}
