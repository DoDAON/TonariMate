'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { reviewDailySubmission } from '@/lib/actions/daily-submissions';
import { formatTeamName } from '@/lib/utils';
import { ImageWithLightbox } from '@/components/features/missions/ImageWithLightbox';
import type { DailySubmissionWithUser } from '@/lib/queries/daily-submissions';

interface DailySubmissionListProps {
  submissions: DailySubmissionWithUser[];
  meetingId: string;
  reviewerId: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: '대기',
  approved: '승인',
  rejected: '거절',
};

function SubmissionCard({
  sub,
  meetingId,
  reviewerId,
}: {
  sub: DailySubmissionWithUser;
  meetingId: string;
  reviewerId: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleReview(action: 'approve' | 'reject') {
    if (action === 'reject' && !confirm('이 제출물을 거절하시겠습니까?')) return;
    setLoading(true);
    const result = await reviewDailySubmission(sub.id, meetingId, reviewerId, action);
    setLoading(false);
    if (!result.success) toast.error(result.error ?? '처리에 실패했습니다');
  }

  const teamLabel =
    sub.team_number !== null && sub.team_name !== null
      ? formatTeamName(sub.team_number, sub.team_name)
      : '-';

  return (
    <div className="border-2 border-border p-4 space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-black text-sm">{sub.submitter_name ?? '-'}</span>
          <span className="text-xs text-muted-foreground">{teamLabel}</span>
          <span
            className={`px-2 py-0.5 text-xs font-bold border-2 border-border ${
              sub.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : sub.status === 'approved'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-destructive text-destructive-foreground'
            }`}
          >
            {STATUS_LABEL[sub.status]}
          </span>
          {sub.status === 'approved' && (
            <span className="text-xs font-mono font-bold">+1pt</span>
          )}
        </div>
        <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">{sub.submitted_date}</span>
      </div>

      {/* 이미지 */}
      <div className="relative w-full aspect-video border-2 border-border overflow-hidden bg-muted">
        <ImageWithLightbox
          src={sub.image_url}
          alt={`${teamLabel} 데일리 제출물`}
          fill
          className="object-cover"
          containerClassName="relative w-full h-full"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {sub.completed_at && (
        <p className="text-xs text-muted-foreground">
          수행일: {new Date(sub.completed_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
        </p>
      )}

      {sub.note && (
        <p className="text-sm border-l-2 border-border pl-3 text-muted-foreground">{sub.note}</p>
      )}

      {/* 심사 버튼 */}
      {sub.status === 'pending' && (
        <div className="flex gap-2 pt-1 border-t-2 border-border">
          <button
            type="button"
            onClick={() => handleReview('approve')}
            disabled={loading}
            className="btn-brutal text-sm flex-1"
          >
            {loading ? '...' : '승인 (+1pt)'}
          </button>
          <button
            type="button"
            onClick={() => handleReview('reject')}
            disabled={loading}
            className="btn-brutal bg-destructive text-destructive-foreground text-sm flex-1"
          >
            {loading ? '...' : '거절'}
          </button>
        </div>
      )}
    </div>
  );
}

export function DailySubmissionList({ submissions, meetingId, reviewerId }: DailySubmissionListProps) {
  if (submissions.length === 0) {
    return <p className="text-sm text-muted-foreground">이번 주 제출 내역이 없습니다.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {submissions.map((sub) => (
        <SubmissionCard
          key={sub.id}
          sub={sub}
          meetingId={meetingId}
          reviewerId={reviewerId}
        />
      ))}
    </div>
  );
}
