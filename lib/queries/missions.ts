import { createClient } from '@/lib/supabase/server';
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
  upcoming: MissionSummary[];
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
    return { active: [], upcoming: [], completed: [] };
  }

  return {
    active: data.filter((m) => m.status === 'active'),
    upcoming: data.filter((m) => m.status === 'upcoming'),
    completed: data.filter((m) => m.status === 'completed'),
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

  return data;
}
