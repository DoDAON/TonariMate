'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMission, updateMission } from '@/lib/actions/admin-missions';
import { ROUTES } from '@/lib/constants/routes';

interface MissionFormProps {
  meetingId: string;
  mode: 'create' | 'edit';
  missionId?: string;
  defaultValues?: {
    title: string;
    description: string;
    points: number;
    start_date: string;
    end_date: string;
    status: 'active' | 'completed';
  };
}

export function MissionForm({ meetingId, mode, missionId, defaultValues }: MissionFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = mode === 'create'
      ? await createMission(meetingId, formData)
      : await updateMission(missionId!, meetingId, formData);

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? '오류가 발생했습니다');
      return;
    }

    router.push(ROUTES.ADMIN_MEETING_MISSIONS(meetingId));
  }

  return (
    <form onSubmit={handleSubmit} className="card-brutal space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-bold uppercase mb-1">
          제목 *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={defaultValues?.title ?? ''}
          className="input-brutal w-full"
          placeholder="미션 제목"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-bold uppercase mb-1">
          설명 *
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          defaultValue={defaultValues?.description ?? ''}
          className="input-brutal w-full resize-none"
          placeholder="미션에 대한 상세 설명"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="points" className="block text-sm font-bold uppercase mb-1">
            포인트
          </label>
          <input
            id="points"
            name="points"
            type="number"
            min={1}
            defaultValue={defaultValues?.points ?? 10}
            className="input-brutal w-full"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-bold uppercase mb-1">
            상태
          </label>
          <select
            id="status"
            name="status"
            defaultValue={defaultValues?.status ?? 'active'}
            className="input-brutal w-full"
          >
            <option value="active">진행 중</option>
            <option value="completed">종료</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-bold uppercase mb-1">
            시작일 *
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            defaultValue={defaultValues?.start_date ?? ''}
            className="input-brutal w-full"
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm font-bold uppercase mb-1">
            종료일 *
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            required
            defaultValue={defaultValues?.end_date ?? ''}
            className="input-brutal w-full"
          />
        </div>
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
          {loading ? '처리 중...' : mode === 'create' ? '미션 생성' : '수정 완료'}
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
