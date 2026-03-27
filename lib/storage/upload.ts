import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/storage/compress';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_SIZE = 20 * 1024 * 1024; // 20MB (압축 전 원본 허용 크기)

export async function uploadAvatarImage(
  file: File,
  userId: string
): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: 'JPEG, PNG, WebP, HEIC 이미지만 업로드 가능합니다' };
  }

  if (file.size > MAX_SIZE) {
    return { success: false, error: '파일 크기는 20MB 이하여야 합니다' };
  }

  const compressed = await compressImage(file);
  const path = `${userId}/avatar.jpg`;

  const supabase = createClient();

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' });

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
    return { success: false, error: 'JPEG, PNG, WebP, HEIC 이미지만 업로드 가능합니다' };
  }

  if (file.size > MAX_SIZE) {
    return { success: false, error: '파일 크기는 20MB 이하여야 합니다' };
  }

  const compressed = await compressImage(file);
  // teamId를 별도 폴더로 분리해야 Storage RLS의 foldername()[3]이 teamId를 올바르게 파싱함
  const path = `${meetingId}/${missionId}/${teamId}/image.jpg`;

  const supabase = createClient();

  const { error } = await supabase.storage
    .from('mission-images')
    .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' });

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
    return { success: false, error: 'JPEG, PNG, WebP, HEIC 이미지만 업로드 가능합니다' };
  }

  if (file.size > MAX_SIZE) {
    return { success: false, error: '파일 크기는 20MB 이하여야 합니다' };
  }

  const compressed = await compressImage(file);
  const path = `daily/${meetingId}/${userId}/${date}/image.jpg`;

  const supabase = createClient();

  const { error } = await supabase.storage
    .from('mission-images')
    .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' });

  if (error) {
    console.error('[Daily upload error]', error.message, error);
    return { success: false, error: `이미지 업로드에 실패했습니다: ${error.message}` };
  }

  const { data: urlData } = supabase.storage
    .from('mission-images')
    .getPublicUrl(path);

  // 같은 경로로 upsert 시 Next.js Image 캐시가 갱신되도록 버전 파라미터 추가
  return { success: true, url: `${urlData.publicUrl}?v=${Date.now()}` };
}
