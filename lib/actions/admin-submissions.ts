'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function reviewSubmission(
  submissionId: string,
  meetingId: string,
  reviewerId: string,
  action: 'approve' | 'reject',
  points?: number
): Promise<ActionResult> {
  const supabase = await createClient();

  // 제출물 조회
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
    // 미션 기본 포인트 조회
    const { data: mission } = await supabase
      .from('missions')
      .select('points')
      .eq('id', submission.mission_id)
      .single();

    const awardPoints = points ?? mission?.points ?? 10;

    // 제출물 업데이트
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

    // points 테이블에 INSERT (트리거가 team.total_points 자동 갱신)
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
    // reject
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

  revalidatePath(ROUTES.ADMIN_MEETING_SUBMISSIONS(meetingId));

  return { success: true };
}
