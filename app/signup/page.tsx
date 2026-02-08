'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/constants/routes';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('이름을 입력해주세요');
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

    const { error: insertError } = await supabase.from('users').insert({
      id: user.id,
      email: user.email!,
      name: name.trim(),
      student_id: studentId.trim() || null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    });

    if (insertError) {
      setError('프로필 저장에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
      return;
    }

    router.push(ROUTES.MY);
  };

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
              학번 <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <input
              id="studentId"
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="20241234"
              className="input-brutal"
              maxLength={20}
            />
          </div>

          {error && (
            <p className="text-destructive text-sm font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-brutal touch-target w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '저장 중...' : '시작하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
