import { createClient } from '@/lib/supabase/server';

export interface LeaderboardTeam {
  id: string;
  name: string;
  team_number: number;
  total_points: number;
  member_count: number;
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

  // 각 팀의 멤버 수 조회
  const teamIds = teams.map((t) => t.id);

  if (teamIds.length === 0) return [];

  const { data: memberCounts, error: mcError } = await supabase
    .from('team_members')
    .select('team_id')
    .in('team_id', teamIds);

  if (mcError || !memberCounts) {
    // 멤버 수 없이 반환
    return teams.map((t) => ({ ...t, member_count: 0 }));
  }

  // team_id별 카운트 집계
  const countMap = new Map<string, number>();
  for (const row of memberCounts) {
    countMap.set(row.team_id, (countMap.get(row.team_id) ?? 0) + 1);
  }

  return teams.map((t) => ({
    ...t,
    member_count: countMap.get(t.id) ?? 0,
  }));
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
