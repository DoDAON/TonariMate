'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

export async function createAnnouncement(
  meetingId: string,
  userId: string,
  formData: FormData
): Promise<ActionResult> {
  const title = (formData.get('title') as string)?.trim();
  const body = (formData.get('body') as string)?.trim();

  if (!title || !body) {
    return { success: false, error: '제목과 내용을 모두 입력해주세요' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('announcements')
    .insert({ meeting_id: meetingId, title, body, created_by: userId })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: '공지사항 작성에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING_ANNOUNCEMENTS(meetingId));
  revalidatePath(ROUTES.MEETING(meetingId));

  return { success: true, id: data.id };
}

export async function updateAnnouncement(
  announcementId: string,
  meetingId: string,
  formData: FormData
): Promise<ActionResult> {
  const title = (formData.get('title') as string)?.trim();
  const body = (formData.get('body') as string)?.trim();

  if (!title || !body) {
    return { success: false, error: '제목과 내용을 모두 입력해주세요' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('announcements')
    .update({ title, body, updated_at: new Date().toISOString() })
    .eq('id', announcementId);

  if (error) {
    return { success: false, error: '공지사항 수정에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING_ANNOUNCEMENTS(meetingId));
  revalidatePath(ROUTES.MEETING(meetingId));

  return { success: true };
}

export async function deleteAnnouncement(
  announcementId: string,
  meetingId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', announcementId);

  if (error) {
    return { success: false, error: '공지사항 삭제에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING_ANNOUNCEMENTS(meetingId));
  revalidatePath(ROUTES.MEETING(meetingId));

  return { success: true };
}
