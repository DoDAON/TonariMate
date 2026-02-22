'use client';

import { useState } from 'react';
import Image from 'next/image';
import { reviewSubmission } from '@/lib/actions/admin-submissions';
import type { AdminSubmission } from '@/lib/queries/admin-submissions';

interface SubmissionReviewCardProps {
  submission: AdminSubmission;
  meetingId: string;
  reviewerId: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SubmissionReviewCard({ submission, meetingId, reviewerId }: SubmissionReviewCardProps) {
  const [loading, setLoading] = useState(false);
  const [customPoints, setCustomPoints] = useState(submission.mission_points);

  async function handleReview(action: 'approve' | 'reject') {
    if (action === 'reject' && !confirm('이 제출물을 거절하시겠습니까?')) return;
    setLoading(true);
    const result = await reviewSubmission(
      submission.id,
      meetingId,
      reviewerId,
      action,
      action === 'approve' ? customPoints : undefined
    );
    setLoading(false);
    if (!result.success) {
      alert(result.error);
    }
  }

  const isPending = submission.status === 'pending';

  return (
    <div className="card-brutal">
      {/* 이미지 */}
      <div className="relative w-full aspect-video mb-3 border-2 border-border overflow-hidden bg-muted">
        <Image
          src={submission.image_url}
          alt={`${submission.team_name} 제출물`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* 정보 */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center justify-between">
          <span className="font-black">{submission.mission_title}</span>
          <span
            className={`px-2 py-0.5 text-xs font-bold uppercase border-2 border-border ${
              submission.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : submission.status === 'approved'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-destructive text-destructive-foreground'
            }`}
          >
            {submission.status === 'pending' ? '대기' : submission.status === 'approved' ? '승인' : '거절'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {submission.team_number}조 {submission.team_name} · {submission.submitter_name}
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          {formatDate(submission.created_at)}
        </p>
      </div>

      {/* 심사 액션 */}
      {isPending && (
        <div className="border-t-2 border-border pt-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <label htmlFor={`points-${submission.id}`} className="text-sm font-bold">PT</label>
              <input
                id={`points-${submission.id}`}
                type="number"
                min={0}
                value={customPoints}
                onChange={(e) => setCustomPoints(Number(e.target.value))}
                className="input-brutal w-20 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => handleReview('approve')}
              disabled={loading}
              className="btn-brutal text-sm flex-1"
            >
              {loading ? '...' : '승인'}
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
        </div>
      )}

      {/* 승인된 경우 포인트 표시 */}
      {submission.status === 'approved' && (
        <p className="text-sm font-mono font-bold border-t-2 border-border pt-3">
          +{submission.points_awarded}pt 부여됨
        </p>
      )}
    </div>
  );
}
