import { createClient } from '@/lib/supabase/client';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

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
  const path = `${meetingId}/${missionId}/${teamId}.${ext}`;

  const supabase = createClient();

  const { error } = await supabase.storage
    .from('mission-images')
    .upload(path, file, { upsert: true });

  if (error) {
    return { success: false, error: '이미지 업로드에 실패했습니다' };
  }

  const { data: urlData } = supabase.storage
    .from('mission-images')
    .getPublicUrl(path);

  return { success: true, url: urlData.publicUrl };
}
