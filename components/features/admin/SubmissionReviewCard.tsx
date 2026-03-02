'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { reviewSubmission, deleteSubmission } from '@/lib/actions/admin-submissions';
import { formatTeamName } from '@/lib/utils';

export interface SubmissionForReview {
  id: string;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  points_awarded: number;
  created_at: string;
  mission_points: number;
  team_name: string;
  team_number: number;
}

interface SubmissionReviewCardProps {
  submission: SubmissionForReview;
  meetingId: string;
  missionId: string;
  reviewerId: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_LABEL: Record<string, string> = {
  pending: '대기',
  approved: '승인',
  rejected: '거절',
};

export function SubmissionReviewCard({
  submission,
  meetingId,
  missionId,
  reviewerId,
}: SubmissionReviewCardProps) {
  const [loading, setLoading] = useState(false);
  const [customPoints, setCustomPoints] = useState(submission.mission_points);

  const teamLabel = formatTeamName(submission.team_number, submission.team_name);

  async function handleReview(action: 'approve' | 'reject') {
    if (action === 'reject' && !confirm('이 제출물을 거절하시겠습니까?')) return;
    setLoading(true);
    const result = await reviewSubmission(
      submission.id,
      meetingId,
      missionId,
      reviewerId,
      action,
      action === 'approve' ? customPoints : undefined
    );
    setLoading(false);
    if (!result.success) toast.error(result.error ?? '처리에 실패했습니다');
  }

  async function handleDelete() {
    if (!confirm(`"${teamLabel}"의 제출물을 삭제하시겠습니까?${submission.status === 'approved' ? '\n승인된 포인트도 회수됩니다.' : ''}`)) return;
    setLoading(true);
    const result = await deleteSubmission(submission.id, meetingId, missionId);
    setLoading(false);
    if (!result.success) toast.error(result.error ?? '삭제에 실패했습니다');
  }

  const isPending = submission.status === 'pending';

  return (
    <div className="border-2 border-border p-4 space-y-3">
      {/* 조 정보 + 상태 + 삭제 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-black">{teamLabel}</span>
          <span
            className={`px-2 py-0.5 text-xs font-bold uppercase border-2 border-border ${
              submission.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : submission.status === 'approved'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-destructive text-destructive-foreground'
            }`}
          >
            {STATUS_LABEL[submission.status]}
          </span>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="text-xs text-destructive font-bold hover:underline"
        >
          삭제
        </button>
      </div>

      {/* 이미지 */}
      <div className="relative w-full aspect-video border-2 border-border overflow-hidden bg-muted">
        <Image
          src={submission.image_url}
          alt={`${teamLabel} 제출물`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      <p className="text-xs text-muted-foreground font-mono">{formatDate(submission.created_at)}</p>

      {/* 심사 액션 */}
      {isPending && (
        <div className="flex items-center gap-3 pt-1 border-t-2 border-border">
          <div className="flex items-center gap-2">
            <label className="text-sm font-bold">PT</label>
            <input
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
      )}

      {submission.status === 'approved' && (
        <p className="text-sm font-mono font-bold border-t-2 border-border pt-2">
          +{submission.points_awarded}pt 부여됨
        </p>
      )}
    </div>
  );
}
