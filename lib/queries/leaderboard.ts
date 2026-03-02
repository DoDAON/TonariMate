import { createClient } from '@/lib/supabase/server';

export interface LeaderboardTeam {
  id: string;
  name: string;
  team_number: number;
  total_points: number;
  member_count: number;
  members: { name: string; avatar_url: string | null }[];
}

export async function getTeamLeaderboard(
  meetingId: string
): Promise<LeaderboardTeam[]> {
  const supabase = await createClient();

  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, name, team_number, total_points')
    .eq('meeting_id', meetingId)
    .order('team_number', { ascending: true });

  if (error || !teams) return [];

  const teamIds = teams.map((t) => t.id);
  if (teamIds.length === 0) return [];

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team_id, users (name, avatar_url)')
    .in('team_id', teamIds);

  const memberMap = new Map<string, { name: string; avatar_url: string | null }[]>();
  for (const row of teamMembers ?? []) {
    if (!row.users) continue;
    const list = memberMap.get(row.team_id) ?? [];
    list.push({ name: row.users.name, avatar_url: row.users.avatar_url });
    memberMap.set(row.team_id, list);
  }

  return teams.map((t) => {
    const members = memberMap.get(t.id) ?? [];
    return { ...t, member_count: members.length, members };
  });
}

// --- 포인트 히스토리 ---

export interface PointRecord {
  id: string;
  amount: number;
  reason: string;
  mission_title: string | null;
  created_at: string;
}

export async function getTeamPointsHistory(
  teamId: string
): Promise<PointRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('points')
    .select(`
      id,
      amount,
      reason,
      created_at,
      missions (title)
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    amount: row.amount,
    reason: row.reason,
    mission_title: row.missions?.title ?? null,
    created_at: row.created_at,
  }));
}

// --- 팀 상세 ---

export interface TeamDetail {
  id: string;
  name: string;
  team_number: number;
  total_points: number;
  meeting_id: string;
  members: {
    id: string;
    name: string;
    avatar_url: string | null;
  }[];
}

export async function getTeamDetail(
  teamId: string,
  meetingId: string
): Promise<TeamDetail | null> {
  const supabase = await createClient();

  const { data: team, error } = await supabase
    .from('teams')
    .select('id, name, team_number, total_points, meeting_id')
    .eq('id', teamId)
    .eq('meeting_id', meetingId)
    .single();

  if (error || !team) return null;

  const { data: members, error: mError } = await supabase
    .from('team_members')
    .select(`
      users (id, name, avatar_url)
    `)
    .eq('team_id', teamId);

  if (mError || !members) return { ...team, members: [] };

  return {
    ...team,
    members: members
      .filter((m) => m.users !== null)
      .map((m) => ({
        id: m.users!.id,
        name: m.users!.name,
        avatar_url: m.users!.avatar_url,
      })),
  };
}
