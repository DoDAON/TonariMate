'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

interface JoinMeetingResult {
  success: boolean;
  meetingName?: string;
  error?: string;
}

export async function joinMeeting(userId: string, inviteCode: string): Promise<JoinMeetingResult> {
  const trimmed = inviteCode.trim();
  if (!trimmed) {
    return { success: false, error: '초대 코드를 입력해주세요' };
  }

  const supabase = await createClient();

  // 1. 초대 코드로 모임 조회
  const { data: meeting, error: findError } = await supabase
    .from('meetings')
    .select('id, name')
    .eq('invite_code', trimmed)
    .eq('is_active', true)
    .single();

  if (findError || !meeting) {
    return { success: false, error: '유효하지 않은 초대 코드입니다' };
  }

  // 2. 모임 참여
  const { error: joinError } = await supabase
    .from('meeting_members')
    .insert({
      meeting_id: meeting.id,
      user_id: userId,
      role: 'member',
    });

  if (joinError) {
    if (joinError.code === '23505') {
      return { success: false, error: '이미 참여한 모임입니다' };
    }
    return { success: false, error: '모임 참여에 실패했습니다. 다시 시도해주세요.' };
  }

  revalidatePath(ROUTES.MY);

  return { success: true, meetingName: meeting.name };
}
