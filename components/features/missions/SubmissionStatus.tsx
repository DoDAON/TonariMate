'use client';

import { useState, useEffect } from 'react';
import type { TeamSubmission } from '@/lib/queries/missions';
import { ImageWithLightbox } from './ImageWithLightbox';
import MissionSubmissionForm from './MissionSubmissionForm';

const STATUS_MAP = {
  pending: { label: '심사 중', className: 'bg-muted text-muted-foreground' },
  approved: { label: '승인', className: 'bg-primary text-primary-foreground' },
  rejected: { label: '반려', className: 'bg-destructive text-destructive-foreground' },
} as const;

interface SubmissionStatusProps {
  submission: TeamSubmission;
  missionId: string;
  meetingId: string;
  teamId: string;
  userId: string;
  missionType: 'weekly' | 'team_naming' | 'individual';
  missionActive: boolean;
  missionStartDate?: string;
  missionEndDate?: string;
}

export default function SubmissionStatus({
  submission,
  missionId,
  meetingId,
  teamId,
  userId,
  missionType,
  missionActive,
  missionStartDate,
  missionEndDate,
}: SubmissionStatusProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);
  const status = STATUS_MAP[submission.status];
  const submittedDate = new Date(submission.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const canResubmit = missionActive && submission.status === 'rejected';
  const canEdit = missionActive && submission.status === 'pending';

  return (
    <div className="space-y-4">
      {/* 상태 배지 */}
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 text-xs font-bold uppercase border-2 border-border ${status.className}`}>
          {status.label}
        </span>
        {submission.status === 'approved' && submission.points_awarded > 0 && (
          <span className="font-mono font-bold text-sm">+{submission.points_awarded}pt</span>
        )}
      </div>

      {/* 반려 사유 */}
      {submission.status === 'rejected' && submission.rejection_reason && (
        <div className="border-2 border-destructive p-3 bg-destructive/10">
          <p className="text-xs font-bold text-destructive mb-1">반려 사유</p>
          <p className="text-sm">{submission.rejection_reason}</p>
        </div>
      )}

      {/* 조 이름 정하기: 텍스트 표시 */}
      {submission.text_content ? (
        <div className="border-2 border-border p-4 bg-muted">
          <p className="text-xs text-muted-foreground uppercase font-bold mb-1">제출된 조 이름</p>
          <p className="text-lg font-black">{submission.text_content}</p>
        </div>
      ) : submission.image_url ? (
        /* 일반 미션: 이미지 표시 */
        <div className="border-2 border-border p-2">
          <ImageWithLightbox
            src={submission.image_url}
            alt="제출 이미지"
            width={600}
            height={400}
            className="w-full max-h-64 object-contain"
          />
        </div>
      ) : null}

      {/* 수행 날짜 */}
      {submission.completed_at && (
        <p className="text-xs text-muted-foreground">
          수행일:{' '}
          {new Date(submission.completed_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      )}

      {/* 메모 */}
      {submission.note && (
        <p className="text-sm border-l-2 border-border pl-3 text-muted-foreground">
          {submission.note}
        </p>
      )}

      {/* 제출자 + 제출일 */}
      <div className="text-xs text-muted-foreground space-y-0.5">
        {submission.submitter_name && (
          <p>제출자: {submission.submitter_name}</p>
        )}
        <p>{submittedDate} 제출</p>
      </div>

      {/* 재제출 / 수정 버튼 */}
      {(canResubmit || canEdit) && (
        <div className="border-t-2 border-border pt-4">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn-brutal bg-muted text-foreground text-sm"
          >
            {canResubmit ? '재제출' : '수정'}
          </button>
        </div>
      )}

      {/* 수정 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="card-brutal w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg uppercase tracking-tight">
                {canResubmit ? '재제출' : '수정'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground font-bold text-lg leading-none"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <MissionSubmissionForm
              missionId={missionId}
              meetingId={meetingId}
              teamId={teamId}
              userId={userId}
              missionType={missionType}
              submissionId={submission.id}
              initialValues={{
                imageUrl: submission.image_url ?? undefined,
                note: submission.note ?? undefined,
                completedAt: submission.completed_at
                  ? submission.completed_at.split('T')[0]
                  : undefined,
                textContent: submission.text_content ?? undefined,
              }}
              onSuccess={() => setShowModal(false)}
              startDate={missionStartDate}
              endDate={missionEndDate}
            />
          </div>
        </div>
      )}
    </div>
  );
}
