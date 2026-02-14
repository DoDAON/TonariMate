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
    .order('total_points', { ascending: false })
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
