import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

/**
 * Global admin 권한 확인. admin이 아니면 /my로 리다이렉트.
 */
export async function requireAdmin(userId: string): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data || data.role !== 'admin') {
    redirect(ROUTES.MY);
  }
}

export interface AdminUserSummary {
  id: string;
  email: string;
  name: string;
  student_id: string | null;
  role: 'user' | 'admin';
  avatar_url: string | null;
  created_at: string;
}

export async function getAllUsers(): Promise<AdminUserSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, student_id, role, avatar_url, created_at')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as AdminUserSummary[];
}

export async function setUserRole(
  userId: string,
  role: 'user' | 'admin'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId);

  if (error) return { success: false, error: '역할 변경에 실패했습니다' };
  return { success: true };
}

export interface AdminMeetingSummary {
  id: string;
  name: string;
  period: string;
  is_active: boolean;
  invite_code: string;
  member_count: number;
  team_count: number;
  mission_count: number;
}

export async function getAdminMeetings(): Promise<AdminMeetingSummary[]> {
  const supabase = await createClient();

  const { data: meetings, error } = await supabase
    .from('meetings')
    .select('id, name, period, is_active, invite_code')
    .order('created_at', { ascending: false });

  if (error || !meetings) return [];

  if (meetings.length === 0) return [];

  const meetingIds = meetings.map((m) => m.id);

  // 멤버수, 팀수, 미션수 병렬 조회
  const [membersResult, teamsResult, missionsResult] = await Promise.all([
    supabase.from('meeting_members').select('meeting_id').in('meeting_id', meetingIds),
    supabase.from('teams').select('meeting_id').in('meeting_id', meetingIds),
    supabase.from('missions').select('meeting_id').in('meeting_id', meetingIds),
  ]);

  const countBy = (rows: { meeting_id: string }[] | null) => {
    const map = new Map<string, number>();
    if (!rows) return map;
    for (const row of rows) {
      map.set(row.meeting_id, (map.get(row.meeting_id) ?? 0) + 1);
    }
    return map;
  };

  const memberMap = countBy(membersResult.data);
  const teamMap = countBy(teamsResult.data);
  const missionMap = countBy(missionsResult.data);

  return meetings.map((m) => ({
    id: m.id,
    name: m.name,
    period: m.period,
    is_active: m.is_active,
    invite_code: m.invite_code,
    member_count: memberMap.get(m.id) ?? 0,
    team_count: teamMap.get(m.id) ?? 0,
    mission_count: missionMap.get(m.id) ?? 0,
  }));
}
