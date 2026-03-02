'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

interface ActionResult {
  success: boolean;
  error?: string;
  missionId?: string;
}

/** 종료일이 오늘 이전이면 'completed', 아니면 'active' */
function computeStatus(endDate: string): 'active' | 'completed' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(endDate) < today ? 'completed' : 'active';
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

  // 종료일이 지나면 자동 종료. 아직 안 지났으면 active 유지.
  const status = computeStatus(endDate);

  const { error } = await supabase
    .from('missions')
    .update({
      title: title.trim(),
      description: description.trim(),
      points: points || 10,
      start_date: startDate,
      end_date: endDate,
      status,
    })
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
