import { createClient } from '@/lib/supabase/server';
import { getEffectiveMissionStatus } from '@/lib/utils';
import type { Database } from '@/types/database';

type MissionStatus = Database['public']['Enums']['mission_status'];

export interface MissionSummary {
  id: string;
  title: string;
  description: string;
  points: number;
  start_date: string;
  end_date: string;
  status: MissionStatus;
}

export interface CategorizedMissions {
  active: MissionSummary[];
  completed: MissionSummary[];
}

export async function getMeetingMissions(
  meetingId: string
): Promise<CategorizedMissions> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('missions')
    .select('id, title, description, points, start_date, end_date, status')
    .eq('meeting_id', meetingId)
    .order('start_date', { ascending: false });

  if (error || !data) {
    return { active: [], completed: [] };
  }

  // 날짜 기반으로 실질 상태 계산
  const withEffective = data.map((m) => ({
    ...m,
    status: getEffectiveMissionStatus(m.status, m.end_date),
  }));

  return {
    active: withEffective.filter((m) => m.status === 'active'),
    completed: withEffective.filter((m) => m.status === 'completed'),
  };
}

export async function getMissionDetail(
  missionId: string,
  meetingId: string
): Promise<MissionSummary | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('missions')
    .select('id, title, description, points, start_date, end_date, status')
    .eq('id', missionId)
    .eq('meeting_id', meetingId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    status: getEffectiveMissionStatus(data.status, data.end_date),
  };
}

export interface TeamSubmission {
  id: string;
  mission_id: string;
  team_id: string;
  submitted_by: string;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  points_awarded: number;
  reviewed_at: string | null;
  created_at: string;
}

export async function getTeamSubmission(
  missionId: string,
  teamId: string
): Promise<TeamSubmission | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mission_submissions')
    .select(
      'id, mission_id, team_id, submitted_by, image_url, status, points_awarded, reviewed_at, created_at'
    )
    .eq('mission_id', missionId)
    .eq('team_id', teamId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}
