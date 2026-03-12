'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { sendPushToMeetingMembers } from '@/lib/actions/push';

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
  const missionType = (formData.get('mission_type') as string) || 'weekly';
  const isTeamNaming = missionType === 'team_naming';

  const rawTitle = formData.get('title') as string;
  const title = isTeamNaming ? '조 이름 정하기' : rawTitle;
  const description = formData.get('description') as string;
  const startDate = formData.get('start_date') as string;
  const endDate = formData.get('end_date') as string;

  if (!title?.trim() || !description?.trim() || !startDate || !endDate) {
    return { success: false, error: '필수 항목을 모두 입력해주세요' };
  }

  // team_naming은 포인트 10 고정, 일반은 기본값 0 (승인 시 드롭다운으로 설정)
  const points = isTeamNaming ? 10 : 0;

  const supabase = await createClient();

  const { data: mission, error } = await supabase
    .from('missions')
    .insert({
      meeting_id: meetingId,
      title: title.trim(),
      description: description.trim(),
      points,
      start_date: startDate,
      end_date: endDate,
      status: computeStatus(endDate),
      mission_type: missionType as 'weekly' | 'team_naming',
    })
    .select('id')
    .single();

  if (error || !mission) {
    return { success: false, error: '미션 생성에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING_MISSIONS(meetingId));

  // 모임 멤버에게 푸시 알림 발송 (VAPID 미설정 시 스킵)
  await sendPushToMeetingMembers(
    meetingId,
    '새 미션이 등록됐습니다',
    title.trim(),
    `${process.env.NEXT_PUBLIC_APP_URL ?? ''}${ROUTES.MEETING(meetingId)}`
  );

  return { success: true, missionId: mission.id };
}

export async function updateMission(
  missionId: string,
  meetingId: string,
  formData: FormData
): Promise<ActionResult> {
  const missionType = (formData.get('mission_type') as string) || 'weekly';
  const isTeamNaming = missionType === 'team_naming';

  const rawTitle = formData.get('title') as string;
  const title = isTeamNaming ? '조 이름 정하기' : rawTitle;
  const description = formData.get('description') as string;
  const startDate = formData.get('start_date') as string;
  const endDate = formData.get('end_date') as string;

  if (!title?.trim() || !description?.trim() || !startDate || !endDate) {
    return { success: false, error: '필수 항목을 모두 입력해주세요' };
  }

  const supabase = await createClient();

  // team_naming 타입은 포인트 10 고정
  const points = isTeamNaming ? 10 : undefined;

  const updateData: Record<string, unknown> = {
    title: title.trim(),
    description: description.trim(),
    start_date: startDate,
    end_date: endDate,
    status: computeStatus(endDate),
    mission_type: missionType,
  };
  if (points !== undefined) {
    updateData.points = points;
  }

  const { error } = await supabase
    .from('missions')
    .update(updateData)
    .eq('id', missionId);

  if (error) {
    return { success: false, error: '미션 수정에 실패했습니다' };
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
