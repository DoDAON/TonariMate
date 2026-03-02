'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

interface SubmitMissionResult {
  success: boolean;
  error?: string;
}

export async function submitMission(
  missionId: string,
  meetingId: string,
  teamId: string,
  userId: string,
  imageUrl: string,
  note?: string,
  completedAt?: string
): Promise<SubmitMissionResult> {
  const supabase = await createClient();

  // 미션 상태 검증
  const { data: mission, error: missionError } = await supabase
    .from('missions')
    .select('status')
    .eq('id', missionId)
    .eq('meeting_id', meetingId)
    .single();

  if (missionError || !mission) {
    return { success: false, error: '미션을 찾을 수 없습니다' };
  }

  if (mission.status !== 'active') {
    return { success: false, error: '종료된 미션에는 제출할 수 없습니다' };
  }

  // 제출 INSERT
  const { error: insertError } = await supabase
    .from('mission_submissions')
    .insert({
      mission_id: missionId,
      team_id: teamId,
      submitted_by: userId,
      image_url: imageUrl,
      note: note?.trim() || null,
      completed_at: completedAt || null,
    });

  if (insertError) {
    if (insertError.code === '23505') {
      return { success: false, error: '이미 제출한 미션입니다' };
    }
    return { success: false, error: '제출에 실패했습니다. 다시 시도해주세요.' };
  }

  revalidatePath(ROUTES.MISSION(meetingId, missionId));

  return { success: true };
}
