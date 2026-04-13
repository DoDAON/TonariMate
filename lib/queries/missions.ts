import { createClient } from '@/lib/supabase/server';
import { getEffectiveMissionStatus } from '@/lib/utils';
import type { Database } from '@/types/database';

type MissionStatus = Database['public']['Enums']['mission_status'];
type MissionType = Database['public']['Enums']['mission_type'];
type SubmissionStatus = Database['public']['Enums']['submission_status'];

export interface MissionSummary {
  id: string;
  title: string;
  description: string;
  points: number;
  start_date: string;
  end_date: string;
  status: MissionStatus;
  mission_type: MissionType;
  teamSubmissionStatus?: SubmissionStatus;
}

export interface CategorizedMissions {
  active: MissionSummary[];
  completed: MissionSummary[];
}

export async function getMeetingMissions(
  meetingId: string,
  teamId?: string
): Promise<CategorizedMissions> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('missions')
    .select('id, title, description, points, start_date, end_date, status, mission_type')
    .eq('meeting_id', meetingId)
    .order('start_date', { ascending: false });

  if (error || !data) {
    return { active: [], completed: [] };
  }

  let submissionMap = new Map<string, SubmissionStatus>();
  if (teamId) {
    const { data: submissions } = await supabase
      .from('mission_submissions')
      .select('mission_id, status')
      .eq('team_id', teamId);
    if (submissions) {
      submissionMap = new Map(
        submissions.map((s) => [s.mission_id, s.status])
      );
    }
  }

  const withEffective = data.map((m) => ({
    ...m,
    status: getEffectiveMissionStatus(m.status, m.end_date),
    teamSubmissionStatus: submissionMap.get(m.id),
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
    .select('id, title, description, points, start_date, end_date, status, mission_type')
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
  submitter_name: string | null;
  image_url: string | null;
  text_content: string | null;
  note: string | null;
  completed_at: string | null;
  status: 'pending' | 'approved' | 'rejected';
  points_awarded: number;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

/** 개인 미션: 특정 유저의 제출물 조회 */
export async function getMyIndividualSubmission(
  missionId: string,
  teamId: string,
  userId: string
): Promise<TeamSubmission | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mission_submissions')
    .select(
      'id, mission_id, team_id, submitted_by, image_url, text_content, note, completed_at, status, points_awarded, reviewed_at, rejection_reason, created_at, users!mission_submissions_submitted_by_fkey(name)'
    )
    .eq('mission_id', missionId)
    .eq('team_id', teamId)
    .eq('submitted_by', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    mission_id: data.mission_id,
    team_id: data.team_id,
    submitted_by: data.submitted_by,
    submitter_name: (data.users as unknown as { name: string } | null)?.name ?? null,
    image_url: data.image_url,
    text_content: data.text_content,
    note: data.note,
    completed_at: data.completed_at,
    status: data.status,
    points_awarded: data.points_awarded,
    reviewed_at: data.reviewed_at,
    rejection_reason: data.rejection_reason,
    created_at: data.created_at,
  };
}

export interface IndividualMemberSubmission {
  userId: string;
  userName: string;
  submission: TeamSubmission | null;
}

/** 개인 미션: 팀 전원의 제출 현황 조회 */
export async function getTeamIndividualSubmissions(
  missionId: string,
  teamId: string
): Promise<IndividualMemberSubmission[]> {
  const supabase = await createClient();

  // 팀원 목록 조회
  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select('users(id, name)')
    .eq('team_id', teamId);

  if (membersError || !members) return [];

  // 팀의 모든 개인 제출물 조회
  const { data: submissions } = await supabase
    .from('mission_submissions')
    .select(
      'id, mission_id, team_id, submitted_by, image_url, text_content, note, completed_at, status, points_awarded, reviewed_at, rejection_reason, created_at, users!mission_submissions_submitted_by_fkey(name)'
    )
    .eq('mission_id', missionId)
    .eq('team_id', teamId);

  const submissionByUser = new Map(
    (submissions ?? []).map((s) => [s.submitted_by, s])
  );

  return members
    .filter((m) => m.users !== null)
    .map((m) => {
      const user = m.users as unknown as { id: string; name: string };
      const s = submissionByUser.get(user.id);
      return {
        userId: user.id,
        userName: user.name,
        submission: s
          ? {
              id: s.id,
              mission_id: s.mission_id,
              team_id: s.team_id,
              submitted_by: s.submitted_by,
              submitter_name: (s.users as unknown as { name: string } | null)?.name ?? null,
              image_url: s.image_url,
              text_content: s.text_content,
              note: s.note,
              completed_at: s.completed_at,
              status: s.status,
              points_awarded: s.points_awarded,
              reviewed_at: s.reviewed_at,
              rejection_reason: s.rejection_reason,
              created_at: s.created_at,
            }
          : null,
      };
    });
}

export async function getTeamSubmission(
  missionId: string,
  teamId: string
): Promise<TeamSubmission | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mission_submissions')
    .select(
      'id, mission_id, team_id, submitted_by, image_url, text_content, note, completed_at, status, points_awarded, reviewed_at, rejection_reason, created_at, users!mission_submissions_submitted_by_fkey(name)'
    )
    .eq('mission_id', missionId)
    .eq('team_id', teamId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    mission_id: data.mission_id,
    team_id: data.team_id,
    submitted_by: data.submitted_by,
    submitter_name: (data.users as unknown as { name: string } | null)?.name ?? null,
    image_url: data.image_url,
    text_content: data.text_content,
    note: data.note,
    completed_at: data.completed_at,
    status: data.status,
    points_awarded: data.points_awarded,
    reviewed_at: data.reviewed_at,
    rejection_reason: data.rejection_reason,
    created_at: data.created_at,
  };
}
