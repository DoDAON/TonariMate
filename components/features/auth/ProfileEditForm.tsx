'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ProfileEditFormProps {
  userId: string;
  initialName: string;
  initialStudentId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export function ProfileEditForm({
  userId,
  initialName,
  initialStudentId,
  onCancel,
  onSuccess,
}: ProfileEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [studentId, setStudentId] = useState(initialStudentId ?? '');
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
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name: name.trim(),
        student_id: studentId.trim() || null,
      })
      .eq('id', userId);

    if (updateError) {
      setError('프로필 수정에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
      return;
    }

    router.refresh();
    onSuccess();
  };

  return (
    <section className="card-brutal">
      <h2 className="text-lg font-bold uppercase mb-4">프로필 수정</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            maxLength={50}
            required
          />
        </div>

        <div>
          <label htmlFor="edit-studentId" className="block text-sm font-bold uppercase mb-2">
            학번 <span className="text-muted-foreground font-normal">(선택)</span>
          </label>
          <input
            id="edit-studentId"
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

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
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
  );
}
