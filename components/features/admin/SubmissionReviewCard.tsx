'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ImageWithLightbox } from '@/components/features/missions/ImageWithLightbox';
import { reviewSubmission, deleteSubmission } from '@/lib/actions/admin-submissions';
import { formatTeamName } from '@/lib/utils';

export interface SubmissionForReview {
  id: string;
  image_url: string | null;
  text_content: string | null;
  note: string | null;
  completed_at: string | null;
  status: 'pending' | 'approved' | 'rejected';
  points_awarded: number;
  created_at: string;
  mission_type: 'weekly' | 'team_naming';
  team_name: string;
  team_number: number;
  member_count: number;
  submitted_by_name: string | null;
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

/** 멤버 수 기반 포인트 선택지 생성 */
function getPointOptions(memberCount: number): { label: string; value: number }[] {
  if (memberCount < 2) return [];
  const options = [{ label: `전체 (10pt)`, value: 10 }];
  if (memberCount >= 3) {
    options.push({ label: `-1명 (8pt)`, value: 8 });
  }
  if (memberCount >= 4) {
    options.push({ label: `-2명 (7pt)`, value: 7 });
  }
  return options;
}

export function SubmissionReviewCard({
  submission,
  meetingId,
  missionId,
  reviewerId,
}: SubmissionReviewCardProps) {
  const [loading, setLoading] = useState(false);
  const pointOptions = getPointOptions(submission.member_count);
  const [selectedPoints, setSelectedPoints] = useState(pointOptions[0]?.value ?? 10);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState<string>('인원 부족');
  const [rejectCustom, setRejectCustom] = useState('');

  const teamLabel = formatTeamName(submission.team_number, submission.team_name);
  const isTeamNaming = submission.mission_type === 'team_naming';
  // 조 이름 정하기는 포인트 로직 없이 항상 승인 가능, 일반 미션은 멤버 2명 이상 필요
  const canApprove = isTeamNaming || submission.member_count >= 2;

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
      action === 'approve' ? (isTeamNaming ? 10 : selectedPoints) : undefined,
      reason
    );
    setLoading(false);
    if (!result.success) toast.error(result.error ?? '처리에 실패했습니다');
    else setShowRejectForm(false);
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
        <div className="flex items-center gap-2 flex-wrap">
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
          {submission.submitted_by_name && (
            <span className="text-xs text-muted-foreground">by {submission.submitted_by_name}</span>
          )}
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

      {/* 제출 내용 */}
      {isTeamNaming && submission.text_content ? (
        <div className="border-2 border-border p-4 bg-muted">
          <p className="text-xs text-muted-foreground uppercase font-bold mb-1">제출된 조 이름</p>
          <p className="text-lg font-black">{submission.text_content}</p>
        </div>
      ) : submission.image_url ? (
        <div className="relative w-full aspect-video border-2 border-border overflow-hidden bg-muted">
          <ImageWithLightbox
            src={submission.image_url}
            alt={`${teamLabel} 제출물`}
            fill
            className="object-cover"
            containerClassName="relative w-full h-full"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      ) : null}

      {submission.completed_at && (
        <p className="text-xs text-muted-foreground">
          수행일: {new Date(submission.completed_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      )}

      {submission.note && (
        <p className="text-sm border-l-2 border-border pl-3 text-muted-foreground">
          {submission.note}
        </p>
      )}

      <p className="text-xs text-muted-foreground font-mono">{formatDate(submission.created_at)}</p>

      {/* 심사 액션 */}
      {isPending && (
        <div className="pt-1 border-t-2 border-border space-y-2">
          {!isTeamNaming && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold shrink-0">포인트</label>
              {!canApprove ? (
                <p className="text-xs text-destructive font-bold">
                  멤버 2명 이상이어야 승인 가능합니다 (현재 {submission.member_count}명)
                </p>
              ) : (
                <select
                  value={selectedPoints}
                  onChange={(e) => setSelectedPoints(Number(e.target.value))}
                  className="input-brutal text-sm py-1.5"
                >
                  {pointOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleReview('approve')}
              disabled={loading || !canApprove}
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
                {['인원 부족', '미션 사진이 명확하지 않음', '기타'].map((opt) => (
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
        <p className="text-sm font-mono font-bold border-t-2 border-border pt-2">
          +{submission.points_awarded}pt 부여됨
        </p>
      )}
    </div>
  );
}
