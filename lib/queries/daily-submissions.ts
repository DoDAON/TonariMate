import { createClient, createServiceClient } from '@/lib/supabase/server';

export interface DailySubmission {
  id: string;
  meeting_id: string;
  team_id: string;
  submitted_by: string;
  submitted_date: string;
  week_start: string;
  image_url: string;
  completed_at: string | null;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  points_awarded: number;
  created_at: string;
}

export interface DailySubmissionWithUser extends DailySubmission {
  submitter_name: string | null;
  team_name: string | null;
  team_number: number | null;
  reviewer_name: string | null;
}

/**
 * 오늘이 속한 주의 시작일 계산 (항상 캘린더 월요일 기준).
 */
export function getWeekStart(todayStr: string, _meetingStartDate?: string | null): string {
  const date = new Date(todayStr);
  const day = date.getDay(); // 0=일, 1=월 ... 6=토
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

/** 주 시작일로부터 주 끝(일요일) 계산 */
export function getWeekEnd(weekStart: string): string {
  const monday = new Date(weekStart);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday.toISOString().split('T')[0];
}

/** 오늘 날짜 (KST 기준) */
export function getTodayStr(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
}

/** 이번 주 유저의 데일리 제출 목록 (모든 상태 포함) */
export async function getUserWeekDailySubmissions(
  meetingId: string,
  userId: string,
  weekStart: string
): Promise<DailySubmission[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('daily_submissions')
    .select('*')
    .eq('meeting_id', meetingId)
    .eq('submitted_by', userId)
    .eq('week_start', weekStart)
    .order('submitted_date', { ascending: true });

  if (error || !data) return [];
  return data;
}

/** 오늘 유저의 데일리 제출 여부 */
export async function getUserTodayDailySubmission(
  meetingId: string,
  userId: string
): Promise<DailySubmission | null> {
  const supabase = await createClient();
  const today = getTodayStr();

  const { data, error } = await supabase
    .from('daily_submissions')
    .select('*')
    .eq('meeting_id', meetingId)
    .eq('submitted_by', userId)
    .eq('submitted_date', today)
    .single();

  if (error || !data) return null;
  return data;
}

/** 이번 주 팀의 데일리 제출 횟수 (rejected 제외, 전체 팀원 합산) */
export async function getTeamWeeklyDailyCount(
  teamId: string,
  weekStart: string
): Promise<number> {
  const supabase = createServiceClient();

  const { count } = await supabase
    .from('daily_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId)
    .eq('week_start', weekStart)
    .neq('status', 'rejected');

  return count ?? 0;
}

/** 어드민용: 모임의 데일리 제출 목록 (주간 필터 선택적) */
export async function getMeetingDailySubmissions(
  meetingId: string,
  weekStart?: string
): Promise<DailySubmissionWithUser[]> {
  const supabase = await createClient();

  let query = supabase
    .from('daily_submissions')
    .select('*, users!daily_submissions_submitted_by_fkey(name), reviewer:users!daily_submissions_reviewed_by_fkey(name), teams(name, team_number)')
    .eq('meeting_id', meetingId)
    .order('submitted_date', { ascending: false });

  if (weekStart) {
    query = query.eq('week_start', weekStart);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    meeting_id: row.meeting_id,
    team_id: row.team_id,
    submitted_by: row.submitted_by,
    submitted_date: row.submitted_date,
    week_start: row.week_start,
    image_url: row.image_url,
    completed_at: row.completed_at,
    note: row.note,
    status: row.status,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    rejection_reason: row.rejection_reason,
    points_awarded: row.points_awarded,
    created_at: row.created_at,
    submitter_name: (row.users as unknown as { name: string } | null)?.name ?? null,
    team_name: (row.teams as unknown as { name: string; team_number: number } | null)?.name ?? null,
    team_number: (row.teams as unknown as { name: string; team_number: number } | null)?.team_number ?? null,
    reviewer_name: (row.reviewer as unknown as { name: string } | null)?.name ?? null,
  }));
}

export interface TeamDailySubmission extends DailySubmission {
  submitter_name: string | null;
}

/** 팀별 데일리 제출 내역 (조 페이지용, rejected 제외) */
export async function getTeamDailySubmissions(
  teamId: string,
  weekStart?: string
): Promise<TeamDailySubmission[]> {
  const supabase = createServiceClient();

  let query = supabase
    .from('daily_submissions')
    .select('*, users!daily_submissions_submitted_by_fkey(name)')
    .eq('team_id', teamId)
    .neq('status', 'rejected')
    .order('submitted_date', { ascending: true });

  if (weekStart) {
    query = query.eq('week_start', weekStart);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    meeting_id: row.meeting_id,
    team_id: row.team_id,
    submitted_by: row.submitted_by,
    submitted_date: row.submitted_date,
    week_start: row.week_start,
    image_url: row.image_url,
    completed_at: row.completed_at,
    note: row.note,
    status: row.status,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    rejection_reason: row.rejection_reason,
    points_awarded: row.points_awarded,
    created_at: row.created_at,
    submitter_name: (row.users as unknown as { name: string } | null)?.name ?? null,
  }));
}
