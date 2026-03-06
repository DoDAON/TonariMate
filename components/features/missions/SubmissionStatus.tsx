import type { TeamSubmission } from '@/lib/queries/missions';
import { ImageWithLightbox } from './ImageWithLightbox';

const STATUS_MAP = {
  pending: { label: '심사 중', className: 'bg-muted text-muted-foreground' },
  approved: { label: '승인', className: 'bg-primary text-primary-foreground' },
  rejected: { label: '반려', className: 'bg-destructive text-destructive-foreground' },
} as const;

interface SubmissionStatusProps {
  submission: TeamSubmission;
}

export default function SubmissionStatus({ submission }: SubmissionStatusProps) {
  const status = STATUS_MAP[submission.status];
  const submittedDate = new Date(submission.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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

      {/* 제출 이미지 */}
      <div className="border-2 border-border p-2">
        <ImageWithLightbox
          src={submission.image_url}
          alt="제출 이미지"
          width={600}
          height={400}
          className="w-full max-h-64 object-contain"
        />
      </div>

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

      {/* 제출일 */}
      <p className="text-xs text-muted-foreground">
        {submittedDate} 제출
      </p>
    </div>
  );
}
