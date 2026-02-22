'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createTeam(
  meetingId: string,
  name: string,
  teamNumber: number
): Promise<ActionResult> {
  if (!name.trim()) {
    return { success: false, error: '팀 이름을 입력해주세요' };
  }

  const supabase = await createClient();

  const { error } = await supabase.from('teams').insert({
    meeting_id: meetingId,
    name: name.trim(),
    team_number: teamNumber,
  });

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: '이미 같은 번호의 팀이 있습니다' };
    }
    return { success: false, error: '팀 생성에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING_TEAMS(meetingId));

  return { success: true };
}

export async function deleteTeam(
  teamId: string,
  meetingId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  // 팀 멤버 먼저 삭제
  await supabase.from('team_members').delete().eq('team_id', teamId);

  const { error } = await supabase.from('teams').delete().eq('id', teamId);

  if (error) {
    return { success: false, error: '팀 삭제에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING_TEAMS(meetingId));

  return { success: true };
}

export async function assignMember(
  teamId: string,
  userId: string,
  meetingId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from('team_members').insert({
    team_id: teamId,
    user_id: userId,
  });

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: '이미 배정된 멤버입니다' };
    }
    return { success: false, error: '멤버 배정에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING_TEAMS(meetingId));

  return { success: true };
}

export async function removeMember(
  teamMemberId: string,
  meetingId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from('team_members').delete().eq('id', teamMemberId);

  if (error) {
    return { success: false, error: '멤버 제거에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING_TEAMS(meetingId));

  return { success: true };
}
