import { createClient } from '@/lib/supabase/server';

export interface AdminSubmission {
  id: string;
  image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  points_awarded: number;
  created_at: string;
  reviewed_at: string | null;
  mission_title: string;
  mission_points: number;
  team_name: string;
  team_number: number;
  submitter_name: string;
}

export async function getSubmissions(
  meetingId: string,
  status?: 'pending' | 'approved' | 'rejected'
): Promise<AdminSubmission[]> {
  const supabase = await createClient();

  // 해당 모임의 미션 ID들
  const { data: missions, error: mError } = await supabase
    .from('missions')
    .select('id, title, points')
    .eq('meeting_id', meetingId);

  if (mError || !missions || missions.length === 0) return [];

  const missionIds = missions.map((m) => m.id);
  const missionMap = new Map(missions.map((m) => [m.id, m]));

  // 제출물 조회
  let query = supabase
    .from('mission_submissions')
    .select(`
      id,
      mission_id,
      team_id,
      image_url,
      status,
      points_awarded,
      created_at,
      reviewed_at,
      teams (name, team_number),
      submitter:users!mission_submissions_submitted_by_fkey (name)
    `)
    .in('mission_id', missionIds)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data
    .filter((s) => s.teams !== null && s.submitter !== null)
    .map((s) => {
      const mission = missionMap.get(s.mission_id);
      return {
        id: s.id,
        image_url: s.image_url,
        status: s.status,
        points_awarded: s.points_awarded,
        created_at: s.created_at,
        reviewed_at: s.reviewed_at,
        mission_title: mission?.title ?? '',
        mission_points: mission?.points ?? 0,
        team_name: s.teams!.name,
        team_number: s.teams!.team_number,
        submitter_name: s.submitter!.name,
      };
    });
}
