'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { deleteAnnouncement } from '@/lib/actions/admin-announcements';

interface DeleteAnnouncementButtonProps {
  announcementId: string;
  meetingId: string;
}

export function DeleteAnnouncementButton({ announcementId, meetingId }: DeleteAnnouncementButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('이 공지사항을 삭제하시겠습니까?')) return;
    setLoading(true);
    const result = await deleteAnnouncement(announcementId, meetingId);
    setLoading(false);
    if (!result.success) toast.error(result.error ?? '삭제에 실패했습니다');
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="btn-brutal bg-destructive text-destructive-foreground text-sm"
    >
      {loading ? '...' : '삭제'}
    </button>
  );
}
