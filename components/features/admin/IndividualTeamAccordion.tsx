'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ImageWithLightbox } from '@/components/features/missions/ImageWithLightbox';
import { reviewSubmission, deleteSubmission } from '@/lib/actions/admin-submissions';
import { formatTeamName } from '@/lib/utils';
import { SUBMISSION_STATUS_MAP } from '@/lib/constants/missions';

export interface IndividualSubmissionItem {
  id: string;
  submittedByName: string | null;
  submittedById: string;
  imageUrl: string | null;
  note: string | null;
  completedAt: string | null;
  status: 'pending' | 'approved' | 'rejected';
  pointsAwarded: number;
  createdAt: string;
  rejectionReason: string | null;
  reviewedByName: string | null;
}

export interface IndividualTeamData {
  teamId: string;
  teamName: string;
  teamNumber: number;
  submissions: IndividualSubmissionItem[];
  totalMembers: number;
}

interface IndividualTeamAccordionProps {
  team: IndividualTeamData;
  meetingId: string;
  missionId: string;
  missionPoints: number;
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

const REJECT_REASONS = ['인원 부족', '미션 사진이 명확하지 않음', '기타'] as const;

function IndividualSubmissionRow({
  submission,
  teamId,
  meetingId,
  missionId,
  missionPoints,
  reviewerId,
}: {
  submission: IndividualSubmissionItem;
  teamId: string;
  meetingId: string;
  missionId: string;
  missionPoints: number;
  reviewerId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState<string>('인원 부족');
  const [rejectCustom, setRejectCustom] = useState('');

  const isPending = submission.status === 'pending';
  const statusInfo = SUBMISSION_STATUS_MAP[submission.status];

  async function handleReview(action: 'approve' | 'reject') {
    setLoading(true);
    let reason: string | undefined;
    if (action === 'reject') {
      reason = rejectReason === '기타' ? rejectCustom.trim() || '기타' : rejectReason;
    }
    const result = await reviewSubmission(
      submission.id,
      meetingId,
      missionId,
      reviewerId,
      action,
      action === 'approve' ? missionPoints : undefined,
      reason
    );
    setLoading(false);
    if (!result.success) toast.error(result.error ?? '처리에 실패했습니다');
    else setShowRejectForm(false);
  }

  async function handleDelete() {
    if (!confirm(`"${submission.submittedByName ?? '?'}"의 제출물을 삭제하시겠습니까?${submission.status === 'approved' ? '\n승인된 포인트도 회수됩니다.' : ''}`)) return;
    setLoading(true);
    const result = await deleteSubmission(submission.id, meetingId, missionId);
    setLoading(false);
    if (!result.success) toast.error(result.error ?? '삭제에 실패했습니다');
  }

  return (
    <div className="border-2 border-border p-3 space-y-2">
      {/* 이름 + 상태 + 삭제 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm">{submission.submittedByName ?? '-'}</span>
          <span className={`px-2 py-0.5 text-xs font-bold border-2 border-border ${statusInfo.className}`}>
            {statusInfo.label}
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
      {submission.imageUrl && (
        <div className="relative w-full aspect-video border-2 border-border overflow-hidden bg-muted">
          <ImageWithLightbox
            src={submission.imageUrl}
            alt={`${submission.submittedByName ?? ''} 제출물`}
            fill
            className="object-cover"
            containerClassName="relative w-full h-full"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}

      {submission.completedAt && (
        <p className="text-xs text-muted-foreground">
          수행일: {new Date(submission.completedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      )}
      {submission.note && (
        <p className="text-sm border-l-2 border-border pl-3 text-muted-foreground">{submission.note}</p>
      )}
      <p className="text-xs text-muted-foreground font-mono">{formatDate(submission.createdAt)}</p>

      {/* 심사 액션 */}
      {isPending && (
        <div className="pt-1 border-t-2 border-border space-y-2">
          <p className="text-xs text-muted-foreground">승인 시 <span className="font-bold text-foreground">{missionPoints}pt</span> 부여</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleReview('approve')}
              disabled={loading}
              className="btn-brutal text-sm flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '...' : '승인'}
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
                {REJECT_REASONS.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name={`reject-reason-${submission.id}`}
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

      {submission.status === 'approved' && (
        <div className="flex items-center justify-between border-t-2 border-border pt-2">
          <p className="text-sm font-mono font-bold">+{submission.pointsAwarded}pt 부여됨</p>
          {submission.reviewedByName && (
            <p className="text-xs text-muted-foreground">심사: {submission.reviewedByName}</p>
          )}
        </div>
      )}
      {submission.status === 'rejected' && submission.rejectionReason && (
        <p className="text-xs text-muted-foreground border-t-2 border-border pt-2">
          반려 사유: {submission.rejectionReason}
        </p>
      )}
    </div>
  );
}

export function IndividualTeamAccordion({
  team,
  meetingId,
  missionId,
  missionPoints,
  reviewerId,
}: IndividualTeamAccordionProps) {
  const [open, setOpen] = useState(false);

  const teamLabel = formatTeamName(team.teamNumber, team.teamName);
  const submittedCount = team.submissions.length;
  const pendingCount = team.submissions.filter((s) => s.status === 'pending').length;

  return (
    <div className="border-2 border-border">
      {/* 아코디언 헤더 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-black">{teamLabel}</span>
          <span className="text-xs text-muted-foreground font-mono">
            {submittedCount}/{team.totalMembers}명 제출
          </span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-400 text-amber-900 border-2 border-amber-500">
              대기 {pendingCount}
            </span>
          )}
        </div>
        <span className="text-muted-foreground font-bold ml-2">{open ? '▲' : '▼'}</span>
      </button>

      {/* 아코디언 내용 */}
      {open && (
        <div className="border-t-2 border-border p-4 space-y-3">
          {team.submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">제출물이 없습니다.</p>
          ) : (
            team.submissions.map((submission) => (
              <IndividualSubmissionRow
                key={submission.id}
                submission={submission}
                teamId={team.teamId}
                meetingId={meetingId}
                missionId={missionId}
                missionPoints={missionPoints}
                reviewerId={reviewerId}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
