import { createClient } from '@/lib/supabase/client';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadAvatarImage(
  file: File,
  userId: string
): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: 'JPEG, PNG, WebP 이미지만 업로드 가능합니다' };
  }

  if (file.size > MAX_SIZE) {
    return { success: false, error: '파일 크기는 5MB 이하여야 합니다' };
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const supabase = createClient();

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (error) {
    console.error('[Avatar upload error]', error.message, error);
    return { success: false, error: `이미지 업로드에 실패했습니다: ${error.message}` };
  }

  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);

  return { success: true, url: urlData.publicUrl };
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadMissionImage(
  file: File,
  meetingId: string,
  missionId: string,
  teamId: string
): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: 'JPEG, PNG, WebP 이미지만 업로드 가능합니다' };
  }

  if (file.size > MAX_SIZE) {
    return { success: false, error: '파일 크기는 5MB 이하여야 합니다' };
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  // teamId를 별도 폴더로 분리해야 Storage RLS의 foldername()[3]이 teamId를 올바르게 파싱함
  const path = `${meetingId}/${missionId}/${teamId}/image.${ext}`;

  const supabase = createClient();

  const { error } = await supabase.storage
    .from('mission-images')
    .upload(path, file, { upsert: true });

  if (error) {
    console.error('[Storage upload error]', error.message, error);
    return { success: false, error: `이미지 업로드에 실패했습니다: ${error.message}` };
  }

  const { data: urlData } = supabase.storage
    .from('mission-images')
    .getPublicUrl(path);

  return { success: true, url: urlData.publicUrl };
}

export async function uploadDailyImage(
  file: File,
  meetingId: string,
  userId: string,
  date: string
): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: 'JPEG, PNG, WebP 이미지만 업로드 가능합니다' };
  }

  if (file.size > MAX_SIZE) {
    return { success: false, error: '파일 크기는 5MB 이하여야 합니다' };
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `daily/${meetingId}/${userId}/${date}/image.${ext}`;

  const supabase = createClient();

  const { error } = await supabase.storage
    .from('mission-images')
    .upload(path, file, { upsert: true });

  if (error) {
    console.error('[Daily upload error]', error.message, error);
    return { success: false, error: `이미지 업로드에 실패했습니다: ${error.message}` };
  }

  const { data: urlData } = supabase.storage
    .from('mission-images')
    .getPublicUrl(path);

  return { success: true, url: urlData.publicUrl };
}
