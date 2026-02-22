'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

interface ActionResult {
  success: boolean;
  error?: string;
  missionId?: string;
}

export async function createMission(
  meetingId: string,
  formData: FormData
): Promise<ActionResult> {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const points = Number(formData.get('points'));
  const startDate = formData.get('start_date') as string;
  const endDate = formData.get('end_date') as string;
  const status = formData.get('status') as string;

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
      status: (status === 'completed' ? 'completed' : 'active') as 'active' | 'completed',
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
  const status = formData.get('status') as string;

  if (!title?.trim() || !description?.trim() || !startDate || !endDate) {
    return { success: false, error: '필수 항목을 모두 입력해주세요' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('missions')
    .update({
      title: title.trim(),
      description: description.trim(),
      points: points || 10,
      start_date: startDate,
      end_date: endDate,
      status: (status === 'completed' ? 'completed' : 'active') as 'active' | 'completed',
    })
    .eq('id', missionId);

  if (error) {
    return { success: false, error: '미션 수정에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING_MISSIONS(meetingId));

  return { success: true };
}

export async function deleteMission(
  missionId: string,
  meetingId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from('missions').delete().eq('id', missionId);

  if (error) {
    return { success: false, error: '미션 삭제에 실패했습니다. 제출물이 있는 미션은 삭제할 수 없습니다.' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING_MISSIONS(meetingId));

  return { success: true };
}
