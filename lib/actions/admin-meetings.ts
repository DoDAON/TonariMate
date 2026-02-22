'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

interface ActionResult {
  success: boolean;
  error?: string;
  meetingId?: string;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createMeeting(
  userId: string,
  formData: FormData
): Promise<ActionResult> {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const period = formData.get('period') as string;

  if (!name?.trim() || !period?.trim()) {
    return { success: false, error: '모임 이름과 기간은 필수입니다' };
  }

  const supabase = await createClient();

  const { data: meeting, error: createError } = await supabase
    .from('meetings')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      period: period.trim(),
      invite_code: generateInviteCode(),
      created_by: userId,
    })
    .select('id')
    .single();

  if (createError || !meeting) {
    return { success: false, error: '모임 생성에 실패했습니다' };
  }

  // admin으로 meeting_members에 추가
  await supabase.from('meeting_members').insert({
    meeting_id: meeting.id,
    user_id: userId,
    role: 'admin',
  });

  revalidatePath(ROUTES.ADMIN);

  return { success: true, meetingId: meeting.id };
}

export async function updateMeeting(
  meetingId: string,
  formData: FormData
): Promise<ActionResult> {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const period = formData.get('period') as string;

  if (!name?.trim() || !period?.trim()) {
    return { success: false, error: '모임 이름과 기간은 필수입니다' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('meetings')
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      period: period.trim(),
    })
    .eq('id', meetingId);

  if (error) {
    return { success: false, error: '모임 수정에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING(meetingId));
  revalidatePath(ROUTES.ADMIN);

  return { success: true };
}

export async function toggleMeetingActive(meetingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: meeting, error: fetchError } = await supabase
    .from('meetings')
    .select('is_active')
    .eq('id', meetingId)
    .single();

  if (fetchError || !meeting) {
    return { success: false, error: '모임을 찾을 수 없습니다' };
  }

  const { error } = await supabase
    .from('meetings')
    .update({ is_active: !meeting.is_active })
    .eq('id', meetingId);

  if (error) {
    return { success: false, error: '상태 변경에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING(meetingId));
  revalidatePath(ROUTES.ADMIN);

  return { success: true };
}

export async function regenerateInviteCode(meetingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('meetings')
    .update({ invite_code: generateInviteCode() })
    .eq('id', meetingId);

  if (error) {
    return { success: false, error: '초대코드 재생성에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING(meetingId));

  return { success: true };
}
