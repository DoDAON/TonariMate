import { createClient } from '@/lib/supabase/server';

export interface UserTeam {
  id: string;
  name: string;
  team_number: number;
  total_points: number;
  members: {
    id: string;
    name: string;
    avatar_url: string | null;
  }[];
}

export async function getUserTeamInMeeting(
  meetingId: string,
  userId: string
): Promise<UserTeam | null> {
  const supabase = await createClient();

  // 유저가 속한 팀 멤버십 조회 (teams 조인)
  const { data: teamMemberships, error: tmError } = await supabase
    .from('team_members')
    .select(`
      teams (
        id,
        name,
        team_number,
        total_points,
        meeting_id
      )
    `)
    .eq('user_id', userId);

  if (tmError || !teamMemberships) return null;

  // 해당 모임의 팀 필터
  const matchingEntry = teamMemberships.find(
    (tm) => tm.teams?.meeting_id === meetingId
  );

  if (!matchingEntry?.teams) return null;

  const team = matchingEntry.teams;

  // 팀원 목록 조회
  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select(`
      users (
        id,
        name,
        avatar_url
      )
    `)
    .eq('team_id', team.id);

  if (membersError || !members) return null;

  return {
    id: team.id,
    name: team.name,
    team_number: team.team_number,
    total_points: team.total_points,
    members: members
      .filter((m) => m.users !== null)
      .map((m) => ({
        id: m.users!.id,
        name: m.users!.name,
        avatar_url: m.users!.avatar_url,
      })),
  };
}
