'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadAvatarImage } from '@/lib/storage/upload';
import { ImageCropModal } from '@/components/features/ImageCropModal';

interface ProfileEditFormProps {
  userId: string;
  initialName: string;
  initialStudentId: string | null;
  initialAvatarUrl: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export function ProfileEditForm({
  userId,
  initialName,
  initialStudentId,
  initialAvatarUrl,
  onCancel,
  onSuccess,
}: ProfileEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [studentId, setStudentId] = useState(initialStudentId ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 아바타
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSource(file);
    e.target.value = '';
  }

  function handleCropConfirm(blob: Blob) {
    const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    setAvatarFile(croppedFile);
    setAvatarPreview(URL.createObjectURL(blob));
    setCropSource(null);
  }

  const studentIdInvalid = studentId.trim().length > 0 && studentId.trim().length !== 8;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('이름을 입력해주세요');
      return;
    }

    if (!studentId.trim()) {
      setError('학번을 입력해주세요');
      return;
    }

    if (studentId.trim().length !== 8) {
      setError('학번은 8자리여야 합니다');
      return;
    }

    setLoading(true);
    setError('');

    // 아바타 처리
    let avatarUrl: string | null | undefined = undefined; // undefined = 변경 없음
    if (avatarFile) {
      const uploadResult = await uploadAvatarImage(avatarFile, userId);
      if (!uploadResult.success || !uploadResult.url) {
        setError(uploadResult.error ?? '이미지 업로드에 실패했습니다');
        setLoading(false);
        return;
      }
      avatarUrl = uploadResult.url;
    }

    const updateData: Record<string, string | null> = {
      name: name.trim(),
      student_id: studentId.trim(),
    };
    if (avatarUrl !== undefined) {
      updateData.avatar_url = avatarUrl;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      setError('프로필 수정에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
      return;
    }

    router.refresh();
    onSuccess();
  };

  const displayAvatar = avatarPreview ?? initialAvatarUrl;

  return (
    <>
    {cropSource && (
      <ImageCropModal
        file={cropSource}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropSource(null)}
      />
    )}
    <section className="card-brutal">
      <h2 className="text-lg font-bold uppercase mb-4">프로필 수정</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 프로필 사진 */}
        <div className="flex flex-col items-center gap-3">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
          {displayAvatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={displayAvatar}
              alt="프로필 사진"
              className="w-28 h-28 border-2 border-foreground object-cover"
            />
          ) : (
            <div className="w-28 h-28 border-2 border-foreground bg-muted flex items-center justify-center text-muted-foreground text-sm">
              사진
            </div>
          )}
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="btn-brutal bg-muted text-foreground text-sm"
          >
            {avatarFile ? '다른 사진 선택' : '사진 변경'}
          </button>
        </div>

        <div>
          <label htmlFor="edit-name" className="block text-sm font-bold uppercase mb-2">
            이름 <span className="text-destructive">*</span>
          </label>
          <input
            id="edit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            className="input-brutal"
            maxLength={10}
            required
          />
        </div>

        <div>
          <label htmlFor="edit-studentId" className="block text-sm font-bold uppercase mb-2">
            학번 <span className="text-destructive">*</span>
          </label>
          <input
            id="edit-studentId"
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="20241234"
            className="input-brutal"
            maxLength={8}
            required
          />
          {studentIdInvalid && (
            <p className="text-xs text-destructive font-bold mt-1">
              학번은 8자리여야 합니다 ({studentId.trim().length}자)
            </p>
          )}
        </div>

        {error && (
          <p className="text-destructive text-sm font-medium">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || studentIdInvalid}
            className="btn-brutal touch-target flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '저장 중...' : '저장'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-brutal touch-target flex-1 bg-muted text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
        </div>
      </form>
    </section>
    </>
  );
}
