import { createClient } from '@/lib/supabase/server';

export interface AdminTeam {
  id: string;
  name: string;
  team_number: number;
  total_points: number;
  members: {
    team_member_id: string;
    user_id: string;
    name: string;
    student_id: string | null;
  }[];
}

export async function getAdminTeams(meetingId: string): Promise<AdminTeam[]> {
  const supabase = await createClient();

  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, name, team_number, total_points')
    .eq('meeting_id', meetingId)
    .order('team_number', { ascending: true });

  if (error || !teams) return [];

  if (teams.length === 0) return [];

  const teamIds = teams.map((t) => t.id);

  const { data: members, error: mError } = await supabase
    .from('team_members')
    .select(`
      id,
      team_id,
      users (id, name, student_id)
    `)
    .in('team_id', teamIds);

  if (mError || !members) {
    return teams.map((t) => ({ ...t, members: [] }));
  }

  const memberMap = new Map<string, AdminTeam['members']>();
  for (const m of members) {
    if (!m.users) continue;
    const list = memberMap.get(m.team_id) ?? [];
    list.push({
      team_member_id: m.id,
      user_id: m.users.id,
      name: m.users.name,
      student_id: m.users.student_id,
    });
    memberMap.set(m.team_id, list);
  }

  return teams.map((t) => ({
    ...t,
    members: memberMap.get(t.id) ?? [],
  }));
}

export interface UnassignedMember {
  user_id: string;
  name: string;
  student_id: string | null;
}

export async function getUnassignedMembers(meetingId: string): Promise<UnassignedMember[]> {
  const supabase = await createClient();

  // 모임 멤버 전체
  const { data: allMembers, error: amError } = await supabase
    .from('meeting_members')
    .select('user_id, users (id, name, student_id)')
    .eq('meeting_id', meetingId);

  if (amError || !allMembers) return [];

  // 해당 모임 팀 ID들
  const { data: teams, error: tError } = await supabase
    .from('teams')
    .select('id')
    .eq('meeting_id', meetingId);

  if (tError || !teams || teams.length === 0) {
    return allMembers
      .filter((m) => m.users !== null)
      .map((m) => ({
        user_id: m.users!.id,
        name: m.users!.name,
        student_id: m.users!.student_id,
      }));
  }

  const teamIds = teams.map((t) => t.id);

  // 팀에 배정된 유저 ID들
  const { data: assigned, error: asError } = await supabase
    .from('team_members')
    .select('user_id')
    .in('team_id', teamIds);

  if (asError || !assigned) {
    return allMembers
      .filter((m) => m.users !== null)
      .map((m) => ({
        user_id: m.users!.id,
        name: m.users!.name,
        student_id: m.users!.student_id,
      }));
  }

  const assignedSet = new Set(assigned.map((a) => a.user_id));

  return allMembers
    .filter((m) => m.users !== null && !assignedSet.has(m.user_id))
    .map((m) => ({
      user_id: m.users!.id,
      name: m.users!.name,
      student_id: m.users!.student_id,
    }));
}
