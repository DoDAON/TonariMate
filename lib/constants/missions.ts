import type { Database } from '@/types/database';

type SubmissionStatus = Database['public']['Enums']['submission_status'];

export const SUBMISSION_STATUS_MAP: Record<
  SubmissionStatus,
  { label: string; className: string }
> = {
  pending: { label: '승인 대기', className: 'bg-amber-400 text-amber-900 border-amber-500' },
  approved: { label: '승인됨', className: 'bg-primary text-primary-foreground border-primary' },
  rejected: { label: '반려됨', className: 'bg-destructive text-destructive-foreground border-destructive' },
};
