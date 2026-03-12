import { createClient } from '@/lib/supabase/server';

export interface Announcement {
  id: string;
  meeting_id: string;
  title: string;
  body: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function getMeetingAnnouncements(meetingId: string): Promise<Announcement[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('announcements')
    .select('id, meeting_id, title, body, created_by, created_at, updated_at')
    .eq('meeting_id', meetingId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function getAnnouncementById(id: string): Promise<Announcement | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('announcements')
    .select('id, meeting_id, title, body, created_by, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
}
