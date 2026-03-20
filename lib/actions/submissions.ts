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
  imageUrl: string | null,
  note?: string,
  completedAt?: string,
  textContent?: string
): Promise<SubmitMissionResult> {
  const supabase = await createClient();

  // 미션 상태 + 타입 검증
  const { data: mission, error: missionError } = await supabase
    .from('missions')
    .select('status, mission_type')
    .eq('id', missionId)
    .eq('meeting_id', meetingId)
    .single();

  if (missionError || !mission) {
    return { success: false, error: '미션을 찾을 수 없습니다' };
  }

  if (mission.status !== 'active') {
    return { success: false, error: '종료된 미션에는 제출할 수 없습니다' };
  }

  const isTeamNaming = mission.mission_type === 'team_naming';

  if (isTeamNaming) {
    if (!textContent?.trim()) {
      return { success: false, error: '조 이름을 입력해주세요' };
    }
    const trimmed = textContent.trim();
    if (trimmed.length < 2 || trimmed.length > 10) {
      return { success: false, error: '조 이름은 2~10자로 입력해주세요' };
    }
  } else {
    if (!imageUrl) {
      return { success: false, error: '이미지를 선택해주세요' };
    }
  }

  const { error: insertError } = await supabase
    .from('mission_submissions')
    .insert({
      mission_id: missionId,
      team_id: teamId,
      submitted_by: userId,
      image_url: imageUrl,
      text_content: textContent?.trim() || null,
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

export async function updateSubmission(
  submissionId: string,
  meetingId: string,
  missionId: string,
  imageUrl: string | null,
  note?: string,
  completedAt?: string,
  textContent?: string
): Promise<SubmitMissionResult> {
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('mission_submissions')
    .select('status')
    .eq('id', submissionId)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: '제출물을 찾을 수 없습니다' };
  }

  if (existing.status !== 'pending' && existing.status !== 'rejected') {
    return { success: false, error: '수정할 수 없는 상태입니다' };
  }

  const { error: updateError } = await supabase
    .from('mission_submissions')
    .update({
      image_url: imageUrl,
      text_content: textContent?.trim() || null,
      note: note?.trim() || null,
      completed_at: completedAt || null,
      status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
      points_awarded: 0,
      rejection_reason: null,
    })
    .eq('id', submissionId);

  if (updateError) {
    return { success: false, error: '수정에 실패했습니다. 다시 시도해주세요.' };
  }

  revalidatePath(ROUTES.MISSION(meetingId, missionId));

  return { success: true };
}
