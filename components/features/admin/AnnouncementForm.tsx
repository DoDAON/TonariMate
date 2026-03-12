'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAnnouncement, updateAnnouncement } from '@/lib/actions/admin-announcements';
import { ROUTES } from '@/lib/constants/routes';

interface AnnouncementFormProps {
  meetingId: string;
  userId: string;
  mode: 'create' | 'edit';
  announcementId?: string;
  defaultValues?: {
    title: string;
    body: string;
  };
}

export function AnnouncementForm({
  meetingId,
  userId,
  mode,
  announcementId,
  defaultValues,
}: AnnouncementFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result =
      mode === 'create'
        ? await createAnnouncement(meetingId, userId, formData)
        : await updateAnnouncement(announcementId!, meetingId, formData);

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? '오류가 발생했습니다');
      return;
    }

    router.push(ROUTES.ADMIN_MEETING_ANNOUNCEMENTS(meetingId));
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
          placeholder="공지사항 제목"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-bold uppercase mb-1">
          내용 *
        </label>
        <textarea
          id="body"
          name="body"
          rows={8}
          required
          defaultValue={defaultValues?.body ?? ''}
          className="input-brutal w-full resize-none"
          placeholder="공지사항 내용을 입력하세요"
        />
      </div>

      {error && <p className="text-sm text-destructive font-bold">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-brutal">
          {loading ? '처리 중...' : mode === 'create' ? '작성하기' : '수정 완료'}
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
