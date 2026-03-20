'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { checkAdmin } from '@/lib/auth';

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function setUserRole(
  targetUserId: string,
  role: 'user' | 'admin'
): Promise<ActionResult> {
  if (!(await checkAdmin())) return { success: false, error: '권한이 없습니다' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', targetUserId);

  if (error) return { success: false, error: '역할 변경에 실패했습니다' };

  revalidatePath(ROUTES.ADMIN_USERS);
  return { success: true };
}

export async function updateUserInfo(
  targetUserId: string,
  name: string,
  studentId: string
): Promise<ActionResult> {
  if (!(await checkAdmin())) return { success: false, error: '권한이 없습니다' };

  const trimmedName = name.trim();
  const trimmedStudentId = studentId.trim();

  if (!trimmedName) return { success: false, error: '이름을 입력해주세요' };
  if (trimmedStudentId && trimmedStudentId.length !== 8)
    return { success: false, error: '학번은 8자리여야 합니다' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('users')
    .update({
      name: trimmedName,
      student_id: trimmedStudentId || null,
    })
    .eq('id', targetUserId);

  if (error) return { success: false, error: '정보 수정에 실패했습니다' };

  revalidatePath(ROUTES.ADMIN_USERS);
  return { success: true };
}

export async function deleteUser(targetUserId: string): Promise<ActionResult> {
  if (!(await checkAdmin())) return { success: false, error: '권한이 없습니다' };

  const supabase = await createClient();

  // 1. 해당 유저의 모임 팀 ID 목록 수집
  const { data: teamRows } = await supabase
    .from('teams')
    .select('id, meeting_id');

  // 2. team_members 수동 삭제 (users FK cascade 없는 경우 대비)
  if (teamRows && teamRows.length > 0) {
    const teamIds = teamRows.map((t) => t.id);
    await supabase
      .from('team_members')
      .delete()
      .eq('user_id', targetUserId)
      .in('team_id', teamIds);
  }

  // 3. meeting_members 삭제
  await supabase
    .from('meeting_members')
    .delete()
    .eq('user_id', targetUserId);

  // 4. public.users 삭제 (auth.users는 cascade 또는 남겨둠)
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', targetUserId);

  if (error) return { success: false, error: '회원탈퇴 처리에 실패했습니다' };

  revalidatePath(ROUTES.ADMIN_USERS);
  return { success: true };
}

export interface UserMeeting {
  id: string;
  name: string;
  period: string;
  is_active: boolean;
}

export async function fetchUserMeetings(userId: string): Promise<UserMeeting[]> {
  if (!(await checkAdmin())) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('meeting_members')
    .select('meetings (id, name, period, is_active)')
    .eq('user_id', userId);

  if (!data) return [];

  return data
    .filter((d) => d.meetings)
    .map((d) => d.meetings as UserMeeting);
}
