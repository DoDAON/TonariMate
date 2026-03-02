'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

interface ActionResult {
  success: boolean;
  error?: string;
}

async function recalcTeamPoints(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  teamId: string
) {
  const { data: pts } = await supabase.from('points').select('amount').eq('team_id', teamId);
  const total = pts?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  await supabase.from('teams').update({ total_points: total }).eq('id', teamId);
}

export async function reviewSubmission(
  submissionId: string,
  meetingId: string,
  missionId: string,
  reviewerId: string,
  action: 'approve' | 'reject',
  points?: number
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: submission, error: fetchError } = await supabase
    .from('mission_submissions')
    .select('id, mission_id, team_id, status')
    .eq('id', submissionId)
    .single();

  if (fetchError || !submission) {
    return { success: false, error: '제출물을 찾을 수 없습니다' };
  }

  if (submission.status !== 'pending') {
    return { success: false, error: '이미 심사된 제출물입니다' };
  }

  if (action === 'approve') {
    const { data: mission } = await supabase
      .from('missions')
      .select('points')
      .eq('id', submission.mission_id)
      .single();

    const awardPoints = points ?? mission?.points ?? 10;

    const { error: updateError } = await supabase
      .from('mission_submissions')
      .update({
        status: 'approved',
        points_awarded: awardPoints,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) {
      return { success: false, error: '승인 처리에 실패했습니다' };
    }

    const { error: pointsError } = await supabase.from('points').insert({
      team_id: submission.team_id,
      mission_id: submission.mission_id,
      amount: awardPoints,
      reason: '미션 완료',
    });

    if (pointsError) {
      return { success: false, error: '포인트 부여에 실패했습니다' };
    }
  } else {
    const { error: updateError } = await supabase
      .from('mission_submissions')
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

  revalidatePath(ROUTES.ADMIN_MEETING_MISSION(meetingId, missionId));

  return { success: true };
}

/**
 * 제출물 삭제. 승인된 경우 포인트 레코드도 삭제하고 total_points 재계산.
 */
export async function deleteSubmission(
  submissionId: string,
  meetingId: string,
  missionId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: submission, error: fetchError } = await supabase
    .from('mission_submissions')
    .select('id, team_id, mission_id, status')
    .eq('id', submissionId)
    .single();

  if (fetchError || !submission) {
    return { success: false, error: '제출물을 찾을 수 없습니다' };
  }

  // 승인된 경우 포인트 회수
  if (submission.status === 'approved') {
    await supabase
      .from('points')
      .delete()
      .eq('team_id', submission.team_id)
      .eq('mission_id', submission.mission_id);

    await recalcTeamPoints(supabase, submission.team_id);
  }

  const { error } = await supabase
    .from('mission_submissions')
    .delete()
    .eq('id', submissionId);

  if (error) {
    return { success: false, error: '제출물 삭제에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING_MISSION(meetingId, missionId));

  return { success: true };
}
