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
