'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * 조 편성: 조 수를 설정하고 기본 이름("1조", "2조", ...)으로 초기화.
 * - 기존 조보다 적은 수로 설정 시 초과 조를 삭제 (멤버/제출물 있으면 에러 반환)
 * - 기존 조는 이름을 기본값으로 리셋
 * - 없는 번호는 새로 생성
 */
export async function setupTeams(meetingId: string, count: number): Promise<ActionResult> {
  if (count < 1 || count > 10) {
    return { success: false, error: '조 수는 1~10 사이여야 합니다' };
  }

  const supabase = await createClient();

  const { data: existingTeams } = await supabase
    .from('teams')
    .select('id, team_number')
    .eq('meeting_id', meetingId)
    .order('team_number');

  const existing = existingTeams ?? [];
  const toDelete = existing.filter((t) => t.team_number > count);

  if (toDelete.length > 0) {
    const toDeleteIds = toDelete.map((t) => t.id);

    // 제출물 존재 여부 확인
    const { data: subs } = await supabase
      .from('mission_submissions')
      .select('id')
      .in('team_id', toDeleteIds)
      .limit(1);

    if (subs && subs.length > 0) {
      return { success: false, error: '삭제할 조에 제출물이 있어 편성을 줄일 수 없습니다.' };
    }

    for (const team of toDelete) {
      await supabase.from('team_members').delete().eq('team_id', team.id);
      await supabase.from('teams').delete().eq('id', team.id);
    }
  }

  // 기존 조 이름 초기화
  for (const team of existing.filter((t) => t.team_number <= count)) {
    await supabase
      .from('teams')
      .update({ name: `${team.team_number}조` })
      .eq('id', team.id);
  }

  // 없는 번호 생성
  const existingNumbers = new Set(existing.filter((t) => t.team_number <= count).map((t) => t.team_number));
  for (let n = 1; n <= count; n++) {
    if (!existingNumbers.has(n)) {
      await supabase.from('teams').insert({
        meeting_id: meetingId,
        name: `${n}조`,
        team_number: n,
      });
    }
  }

  revalidatePath(ROUTES.ADMIN_MEETING_TEAMS(meetingId));

  return { success: true };
}

export async function updateTeamName(
  teamId: string,
  name: string,
  meetingId: string
): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) return { success: false, error: '조 이름은 2자 이상이어야 합니다' };
  if (trimmed.length > 10) return { success: false, error: '조 이름은 10자 이하여야 합니다' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('teams')
    .update({ name: trimmed })
    .eq('id', teamId);

  if (error) return { success: false, error: '이름 변경에 실패했습니다' };

  revalidatePath(ROUTES.ADMIN_MEETING_TEAMS(meetingId));
  return { success: true };
}

export async function deleteTeam(teamId: string, meetingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  await supabase.from('team_members').delete().eq('team_id', teamId);

  const { error } = await supabase.from('teams').delete().eq('id', teamId);

  if (error) {
    return { success: false, error: '조 삭제에 실패했습니다. 제출물이 있는 조는 삭제할 수 없습니다.' };
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

export async function removeMember(teamMemberId: string, meetingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from('team_members').delete().eq('id', teamMemberId);

  if (error) {
    return { success: false, error: '멤버 제거에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING_TEAMS(meetingId));

  return { success: true };
}

/**
 * 멤버를 다른 조로 이동 (삭제 후 재삽입 방식 — RLS 안전)
 */
export async function moveMember(
  teamMemberId: string,
  newTeamId: string,
  meetingId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('id', teamMemberId)
    .single();

  if (!current) {
    return { success: false, error: '멤버를 찾을 수 없습니다' };
  }

  const { error: deleteError } = await supabase.from('team_members').delete().eq('id', teamMemberId);
  if (deleteError) {
    return { success: false, error: '멤버 이동에 실패했습니다' };
  }

  const { error: insertError } = await supabase.from('team_members').insert({
    team_id: newTeamId,
    user_id: current.user_id,
  });

  if (insertError) {
    return { success: false, error: '멤버 이동에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING_TEAMS(meetingId));

  return { success: true };
}
