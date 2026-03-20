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
  const startDate = formData.get('start_date') as string;

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
      start_date: startDate?.trim() || null,
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
  const startDate = formData.get('start_date') as string;

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
      start_date: startDate?.trim() || null,
    })
    .eq('id', meetingId);

  if (error) {
    return { success: false, error: '모임 수정에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING(meetingId));
  revalidatePath(ROUTES.ADMIN);

  return { success: true };
}

export async function endMeeting(meetingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('meetings')
    .update({ is_active: false, end_date: today })
    .eq('id', meetingId);

  if (error) {
    return { success: false, error: '모임 종료에 실패했습니다' };
  }

  revalidatePath(ROUTES.ADMIN_MEETING(meetingId));
  revalidatePath(ROUTES.ADMIN);

  return { success: true };
}

export async function deleteMeeting(meetingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  // Storage 파일 정리 (best-effort: 실패해도 DB 삭제 진행)
  try {
    const { data: folders } = await supabase.storage
      .from('mission-images')
      .list(meetingId);
    if (folders && folders.length > 0) {
      for (const folder of folders) {
        const { data: files } = await supabase.storage
          .from('mission-images')
          .list(`${meetingId}/${folder.name}`);
        if (files && files.length > 0) {
          const paths = files.map((f) => `${meetingId}/${folder.name}/${f.name}`);
          await supabase.storage.from('mission-images').remove(paths);
        }
      }
    }
  } catch {
    // Storage 정리 실패 시 무시하고 DB 삭제 진행
  }

  const { error } = await supabase
    .from('meetings')
    .delete()
    .eq('id', meetingId);

  if (error) {
    return { success: false, error: '모임 삭제에 실패했습니다' };
  }

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
