'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { requireAdmin } from '@/lib/queries/admin';

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function setUserRole(
  targetUserId: string,
  role: 'user' | 'admin',
  currentUserId: string
): Promise<ActionResult> {
  // 요청자가 admin인지 확인
  await requireAdmin(currentUserId);

  const supabase = await createClient();

  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', targetUserId);

  if (error) return { success: false, error: '역할 변경에 실패했습니다' };

  revalidatePath(ROUTES.ADMIN_USERS);
  return { success: true };
}
