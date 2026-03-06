'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadAvatarImage } from '@/lib/storage/upload';
import { ROUTES } from '@/lib/constants/routes';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 아바타
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.avatar_url) {
        setGoogleAvatarUrl(user.user_metadata.avatar_url as string);
      }
    });
  }, []);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
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

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    // 아바타 처리: 새 파일이 있으면 업로드, 없으면 구글 URL 사용
    let avatarUrl: string | null = googleAvatarUrl ?? null;
    if (avatarFile) {
      const uploadResult = await uploadAvatarImage(avatarFile, user.id);
      if (!uploadResult.success || !uploadResult.url) {
        setError(uploadResult.error ?? '이미지 업로드에 실패했습니다');
        setLoading(false);
        return;
      }
      avatarUrl = uploadResult.url;
    }

    const { error: insertError } = await supabase.from('users').insert({
      id: user.id,
      email: user.email!,
      name: name.trim(),
      student_id: studentId.trim(),
      avatar_url: avatarUrl,
    });

    if (insertError) {
      setError('프로필 저장에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
      return;
    }

    router.push(ROUTES.MY);
  };

  const displayAvatar = avatarPreview ?? googleAvatarUrl;

  return (
    <div className="min-h-screen noise-overlay flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tighter uppercase">
            프로필 설정
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            활동에 사용할 정보를 입력해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
                className="w-20 h-20 border-2 border-foreground object-cover"
              />
            ) : (
              <div className="w-20 h-20 border-2 border-foreground bg-muted flex items-center justify-center text-muted-foreground text-sm">
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
            <label htmlFor="name" className="block text-sm font-bold uppercase mb-2">
              이름 <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="input-brutal"
              maxLength={50}
              required
            />
          </div>

          <div>
            <label htmlFor="studentId" className="block text-sm font-bold uppercase mb-2">
              학번 <span className="text-destructive">*</span>
            </label>
            <input
              id="studentId"
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

          <button
            type="submit"
            disabled={loading || studentIdInvalid}
            className="btn-brutal touch-target w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '저장 중...' : '시작하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
