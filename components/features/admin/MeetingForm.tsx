'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMeeting, updateMeeting } from '@/lib/actions/admin-meetings';
import { ROUTES } from '@/lib/constants/routes';

interface MeetingFormProps {
  userId: string;
  mode: 'create' | 'edit';
  meetingId?: string;
  defaultValues?: {
    name: string;
    description: string | null;
    period: string;
    start_date?: string | null;
  };
}

export function MeetingForm({ userId, mode, meetingId, defaultValues }: MeetingFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = mode === 'create'
      ? await createMeeting(userId, formData)
      : await updateMeeting(meetingId!, formData);

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? '오류가 발생했습니다');
      return;
    }

    if (mode === 'create' && result.meetingId) {
      router.push(ROUTES.ADMIN_MEETING(result.meetingId));
    } else if (mode === 'edit' && meetingId) {
      router.push(ROUTES.ADMIN_MEETING(meetingId));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-brutal space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-bold uppercase mb-1">
          모임 이름 *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name ?? ''}
          className="input-brutal w-full"
          placeholder="모임 이름을 입력하세요"
        />
      </div>

      <div>
        <label htmlFor="period" className="block text-sm font-bold uppercase mb-1">
          기간 *
        </label>
        <input
          id="period"
          name="period"
          type="text"
          required
          defaultValue={defaultValues?.period ?? ''}
          className="input-brutal w-full"
          placeholder="예: 2026년 3월 ~ 6월"
        />
      </div>

      <div>
        <label htmlFor="start_date" className="block text-sm font-bold uppercase mb-1">
          시작일
        </label>
        <input
          id="start_date"
          name="start_date"
          type="date"
          defaultValue={defaultValues?.start_date ?? ''}
          className="input-brutal w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">
          데일리 미션 주 기준점으로 사용됩니다.
        </p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-bold uppercase mb-1">
          설명
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ''}
          className="input-brutal w-full resize-none"
          placeholder="모임에 대한 설명 (선택)"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive font-bold">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn-brutal"
        >
          {loading ? '처리 중...' : mode === 'create' ? '모임 생성' : '수정 완료'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-brutal bg-muted text-foreground"
        >
          취소
        </button>
      </div>
    </form>
  );
}
