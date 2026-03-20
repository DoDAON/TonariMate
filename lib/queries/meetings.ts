import { createClient } from '@/lib/supabase/server';

export interface UserMeeting {
  id: string;
  name: string;
  description: string | null;
  period: string;
  is_active: boolean;
  role: 'member' | 'admin';
  joined_at: string;
}

export async function getUserMeetings(userId: string): Promise<UserMeeting[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('meeting_members')
    .select(`
      role,
      joined_at,
      meetings (
        id,
        name,
        description,
        period,
        is_active
      )
    `)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data
    .filter((row) => row.meetings !== null)
    .map((row) => ({
      id: row.meetings!.id,
      name: row.meetings!.name,
      description: row.meetings!.description,
      period: row.meetings!.period,
      is_active: row.meetings!.is_active,
      role: row.role,
      joined_at: row.joined_at,
    }));
}

// --- Phase 2-4: 모임 상세 ---

export interface MeetingDetail {
  id: string;
  name: string;
  description: string | null;
  period: string;
  is_active: boolean;
  created_by: string;
  start_date: string | null;
  end_date: string | null;
  memberRole: 'member' | 'admin';
  memberCount: number;
}

export async function getMeetingDetail(
  meetingId: string,
  userId: string
): Promise<MeetingDetail | null> {
  const supabase = await createClient();

  // 모임 정보 + 멤버십 확인을 병렬로 조회
  const [meetingResult, membershipResult] = await Promise.all([
    supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single(),
    supabase
      .from('meeting_members')
      .select('role')
      .eq('meeting_id', meetingId)
      .eq('user_id', userId)
      .single(),
  ]);

  if (meetingResult.error || !meetingResult.data) return null;
  if (membershipResult.error || !membershipResult.data) return null;

  const { count } = await supabase
    .from('meeting_members')
    .select('*', { count: 'exact', head: true })
    .eq('meeting_id', meetingId);

  return {
    id: meetingResult.data.id,
    name: meetingResult.data.name,
    description: meetingResult.data.description,
    period: meetingResult.data.period,
    is_active: meetingResult.data.is_active,
    created_by: meetingResult.data.created_by,
    start_date: meetingResult.data.start_date,
    end_date: meetingResult.data.end_date,
    memberRole: membershipResult.data.role,
    memberCount: count ?? 0,
  };
}
