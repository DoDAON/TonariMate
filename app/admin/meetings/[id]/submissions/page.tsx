import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { LogoutButton } from '@/components/features/auth/LogoutButton';
import { requireAdmin } from '@/lib/queries/admin';
import { getSubmissions } from '@/lib/queries/admin-submissions';
import { EmptyState } from '@/components/shared/EmptyState';
import { SubmissionReviewCard } from '@/components/features/admin/SubmissionReviewCard';

interface SubmissionsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function SubmissionsPage({ params, searchParams }: SubmissionsPageProps) {
  const { id } = await params;
  const { status: statusFilter } = await searchParams;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  await requireAdmin(user.id);

  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('name')
    .eq('id', id)
    .single();

  if (error || !meeting) {
    notFound();
  }

  const validStatus = statusFilter === 'approved' || statusFilter === 'rejected' || statusFilter === 'pending'
    ? statusFilter
    : undefined;

  const submissions = await getSubmissions(id, validStatus);

  const tabs = [
    { label: '전체', value: undefined },
    { label: '대기', value: 'pending' },
    { label: '승인', value: 'approved' },
    { label: '거절', value: 'rejected' },
  ] as const;

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<LogoutButton />} />

      <main className="container mx-auto px-4 py-8">
        <nav className="mb-6">
          <Link
            href={ROUTES.ADMIN_MEETING(id)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← {meeting.name} 관리로 돌아가기
          </Link>
        </nav>

        <h1 className="text-3xl font-black uppercase tracking-tight mb-6">
          제출물 심사
        </h1>

        {/* 탭 필터 */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => {
            const isActive = validStatus === tab.value;
            const href = tab.value
              ? `${ROUTES.ADMIN_MEETING_SUBMISSIONS(id)}?status=${tab.value}`
              : ROUTES.ADMIN_MEETING_SUBMISSIONS(id);

            return (
              <Link
                key={tab.label}
                href={href}
                className={`px-3 py-1 text-sm font-bold uppercase border-2 border-border transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:translate-x-[1px] hover:translate-y-[1px]'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {submissions.length === 0 ? (
          <EmptyState
            message="제출물이 없습니다"
            description={validStatus ? '해당 상태의 제출물이 없습니다' : undefined}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {submissions.map((submission) => (
              <SubmissionReviewCard
                key={submission.id}
                submission={submission}
                meetingId={id}
                reviewerId={user.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
