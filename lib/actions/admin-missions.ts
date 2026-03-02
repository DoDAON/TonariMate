'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

interface ActionResult {
  success: boolean;
  error?: string;
  missionId?: string;
}

function computeStatus(endDate: string): 'active' | 'completed' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(endDate) < today ? 'completed' : 'active';
}

/** 팀의 total_points를 points 테이블로부터 재계산 */
async function recalcTeamPoints(supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>, teamId: string) {
  const { data: pts } = await supabase
    .from('points')
    .select('amount')
    .eq('team_id', teamId);
  const total = pts?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  await supabase.from('teams').update({ total_points: total }).eq('id', teamId);
}

export async function createMission(meetingId: string, formData: FormData): Promise<ActionResult> {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const points = Number(formData.get('points'));
  const startDate = formData.get('start_date') as string;
  const endDate = formData.get('end_date') as string;

  if (!title?.trim() || !description?.trim() || !startDate || !endDate) {
    return { success: false, error: '필수 항목을 모두 입력해주세요' };
  }

  const supabase = await createClient();

  const { data: mission, error } = await supabase
    .from('missions')
    .insert({
      meeting_id: meetingId,
      title: title.trim(),
      description: description.trim(),
      points: points || 10,
      start_date: startDate,
      end_date: endDate,
      status: computeStatus(endDate),
    })
    .select('id')
    .single();

  if (error || !mission) {
    return { success: false, error: '미션 생성에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING_MISSIONS(meetingId));

  return { success: true, missionId: mission.id };
}

export async function updateMission(
  missionId: string,
  meetingId: string,
  formData: FormData
): Promise<ActionResult> {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const points = Number(formData.get('points'));
  const startDate = formData.get('start_date') as string;
  const endDate = formData.get('end_date') as string;

  if (!title?.trim() || !description?.trim() || !startDate || !endDate) {
    return { success: false, error: '필수 항목을 모두 입력해주세요' };
  }

  const supabase = await createClient();
  const newPoints = points || 10;

  // 포인트 변경 여부 확인
  const { data: currentMission } = await supabase
    .from('missions')
    .select('points')
    .eq('id', missionId)
    .single();

  const pointsChanged = currentMission !== null && currentMission.points !== newPoints;

  const { error } = await supabase
    .from('missions')
    .update({
      title: title.trim(),
      description: description.trim(),
      points: newPoints,
      start_date: startDate,
      end_date: endDate,
      status: computeStatus(endDate),
    })
    .eq('id', missionId);

  if (error) {
    return { success: false, error: '미션 수정에 실패했습니다' };
  }

  // 포인트가 바뀐 경우 승인된 제출물 전부 "대기 중"으로 되돌리고 포인트 회수
  if (pointsChanged) {
    const { data: approvedSubs } = await supabase
      .from('mission_submissions')
      .select('id, team_id')
      .eq('mission_id', missionId)
      .eq('status', 'approved');

    if (approvedSubs && approvedSubs.length > 0) {
      const affectedTeamIds = [...new Set(approvedSubs.map((s) => s.team_id))];

      // 이 미션의 points 레코드 전체 삭제
      await supabase.from('points').delete().eq('mission_id', missionId);

      // 제출물 상태 초기화
      await supabase
        .from('mission_submissions')
        .update({
          status: 'pending',
          points_awarded: 0,
          reviewed_by: null,
          reviewed_at: null,
        })
        .eq('mission_id', missionId)
        .eq('status', 'approved');

      // 영향받은 조의 total_points 재계산
      for (const teamId of affectedTeamIds) {
        await recalcTeamPoints(supabase, teamId);
      }
    }
  }

  revalidatePath(ROUTES.ADMIN_MEETING_MISSIONS(meetingId));
  revalidatePath(ROUTES.ADMIN_MEETING_MISSION(meetingId, missionId));

  return { success: true };
}

export async function deleteMission(missionId: string, meetingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from('missions').delete().eq('id', missionId);

  if (error) {
    return { success: false, error: '미션 삭제에 실패했습니다. 제출물이 있는 미션은 삭제할 수 없습니다.' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING_MISSIONS(meetingId));

  return { success: true };
}
