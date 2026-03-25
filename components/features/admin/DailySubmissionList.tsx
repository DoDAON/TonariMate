'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { reviewDailySubmission, deleteDailySubmission } from '@/lib/actions/daily-submissions';
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
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('미션 사진이 명확하지 않음');
  const [rejectCustom, setRejectCustom] = useState('');

  async function handleReview(action: 'approve' | 'reject') {
    setLoading(true);
    let reason: string | undefined;
    if (action === 'reject') {
      reason = rejectReason === '기타' ? rejectCustom.trim() || '기타' : rejectReason;
    }
    const result = await reviewDailySubmission(sub.id, meetingId, reviewerId, action, reason);
    setLoading(false);
    if (!result.success) toast.error(result.error ?? '처리에 실패했습니다');
    else setShowRejectForm(false);
  }

  async function handleDelete() {
    const confirmed = confirm(
      `이 제출물을 삭제하시겠습니까?${sub.status === 'approved' ? '\n승인된 포인트(3pt)도 회수됩니다.' : ''}`
    );
    if (!confirmed) return;
    setLoading(true);
    const result = await deleteDailySubmission(sub.id, meetingId);
    setLoading(false);
    if (!result.success) toast.error(result.error ?? '삭제에 실패했습니다');
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
            <span className="text-xs font-mono font-bold">+3pt</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">{sub.submitted_date}</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="text-xs text-destructive font-bold hover:underline"
          >
            삭제
          </button>
        </div>
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
        <div className="pt-1 border-t-2 border-border space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleReview('approve')}
              disabled={loading}
              className="btn-brutal text-sm flex-1"
            >
              {loading ? '...' : '승인 (+3pt)'}
            </button>
            <button
              type="button"
              onClick={() => setShowRejectForm((v) => !v)}
              disabled={loading}
              className="btn-brutal bg-destructive text-destructive-foreground text-sm flex-1"
            >
              거절
            </button>
          </div>
          {showRejectForm && (
            <div className="space-y-2 border-t-2 border-border pt-2">
              <label className="text-xs font-bold">반려 사유</label>
              <div className="flex flex-col gap-2">
                {['미션 사진이 명확하지 않음', '인원 부족', '기타'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name={`reject-reason-${sub.id}`}
                      value={opt}
                      checked={rejectReason === opt}
                      onChange={() => setRejectReason(opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
              {rejectReason === '기타' && (
                <input
                  type="text"
                  value={rejectCustom}
                  onChange={(e) => setRejectCustom(e.target.value.slice(0, 20))}
                  placeholder="사유 입력 (최대 20자)"
                  maxLength={20}
                  className="input-brutal w-full text-sm"
                />
              )}
              <button
                type="button"
                onClick={() => handleReview('reject')}
                disabled={loading || (rejectReason === '기타' && !rejectCustom.trim())}
                className="btn-brutal bg-destructive text-destructive-foreground text-sm w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? '...' : '반려 확정'}
              </button>
            </div>
          )}
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
