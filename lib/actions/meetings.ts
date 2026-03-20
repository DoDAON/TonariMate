'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

interface JoinMeetingResult {
  success: boolean;
  meetingName?: string;
  error?: string;
}

interface JoinWithTeamResult {
  success: boolean;
  meetingId?: string;
  meetingName?: string;
  error?: string;
  teamAssigned?: boolean;
}

export async function joinMeeting(userId: string, inviteCode: string): Promise<JoinMeetingResult> {
  const trimmed = inviteCode.trim();
  if (!trimmed) {
    return { success: false, error: '초대 코드를 입력해주세요' };
  }

  const supabase = await createClient();

  // 1. 초대 코드로 모임 조회
  const { data: meeting, error: findError } = await supabase
    .from('meetings')
    .select('id, name')
    .eq('invite_code', trimmed)
    .eq('is_active', true)
    .single();

  if (findError || !meeting) {
    return { success: false, error: '유효하지 않은 초대 코드입니다' };
  }

  // 2. 모임 참여
  const { error: joinError } = await supabase
    .from('meeting_members')
    .insert({
      meeting_id: meeting.id,
      user_id: userId,
      role: 'member',
    });

  if (joinError) {
    if (joinError.code === '23505') {
      return { success: false, error: '이미 참여한 모임입니다' };
    }
    return { success: false, error: '모임 참여에 실패했습니다. 다시 시도해주세요.' };
  }

  revalidatePath(ROUTES.MY);

  return { success: true, meetingName: meeting.name };
}

export async function joinMeetingWithTeam(
  userId: string,
  inviteCode: string,
  teamNumber: number | null,
): Promise<JoinWithTeamResult> {
  const trimmed = inviteCode.trim().toUpperCase();
  if (!trimmed) {
    return { success: false, error: '초대 코드가 없습니다' };
  }

  const supabase = await createClient();

  // 1. 초대 코드로 모임 조회
  const { data: meeting } = await supabase
    .from('meetings')
    .select('id, name')
    .eq('invite_code', trimmed)
    .eq('is_active', true)
    .single();

  if (!meeting) {
    return { success: false, error: '유효하지 않은 초대 코드입니다' };
  }

  // 2. 모임 참여 (이미 참여 중이면 무시하고 계속 진행)
  const { error: joinError } = await supabase
    .from('meeting_members')
    .insert({ meeting_id: meeting.id, user_id: userId, role: 'member' });

  if (joinError && joinError.code !== '23505') {
    return { success: false, error: '모임 참여에 실패했습니다' };
  }

  if (!teamNumber) {
    return { success: true, meetingId: meeting.id, meetingName: meeting.name, teamAssigned: false };
  }

  // 3. 이미 이 모임에서 팀 소속인지 확인
  const { data: meetingTeams } = await supabase
    .from('teams')
    .select('id')
    .eq('meeting_id', meeting.id);

  const teamIds = meetingTeams?.map((t) => t.id) ?? [];

  if (teamIds.length > 0) {
    const { data: existingTeamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', userId)
      .in('team_id', teamIds)
      .maybeSingle();

    if (existingTeamMember) {
      return { success: true, meetingId: meeting.id, meetingName: meeting.name, teamAssigned: false };
    }
  }

  // 4. team_number로 팀 조회
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('meeting_id', meeting.id)
    .eq('team_number', teamNumber)
    .maybeSingle();

  if (!team) {
    return { success: true, meetingId: meeting.id, meetingName: meeting.name, teamAssigned: false };
  }

  // 5. 팀 배정 (서비스 롤로 RLS 우회 — 위에서 이미 모든 조건 검증 완료)
  const serviceClient = createServiceClient();
  const { error: teamError } = await serviceClient
    .from('team_members')
    .insert({ team_id: team.id, user_id: userId });

  if (teamError) {
    return { success: true, meetingId: meeting.id, meetingName: meeting.name, teamAssigned: false };
  }

  return { success: true, meetingId: meeting.id, meetingName: meeting.name, teamAssigned: true };
}
