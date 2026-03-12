import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { requireAdmin } from '@/lib/queries/admin';
import { getMeetingDailySubmissions, getWeekStart, getTodayStr } from '@/lib/queries/daily-submissions';
import { DailySubmissionList } from '@/components/features/admin/DailySubmissionList';
import { WeekSelector } from '@/components/shared/WeekSelector';

interface DailyPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ week?: string }>;
}

export default async function AdminDailyPage({ params, searchParams }: DailyPageProps) {
  const { id: meetingId } = await params;
  const { week } = await searchParams;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect(ROUTES.LOGIN);

  await requireAdmin(user.id);

  const { data: meeting } = await supabase
    .from('meetings')
    .select('start_date')
    .eq('id', meetingId)
    .single();

  const today = getTodayStr();
  const currentWeekStart = getWeekStart(today, meeting?.start_date);
  const selectedWeek = week || currentWeekStart;

  const submissions = await getMeetingDailySubmissions(meetingId, selectedWeek);

  // 지난 4주 목록 생성 (주 탐색용, 조모임 시작일 기준)
  const weeks: string[] = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = getWeekStart(
      new Date(new Date(today).setDate(new Date(today).getDate() - i * 7))
        .toISOString()
        .split('T')[0],
      meeting?.start_date
    );
    if (!weeks.includes(weekStart)) {
      weeks.push(weekStart);
    }
  }

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<HeaderActions />} />

      <main className="container mx-auto px-4 py-8">
        <nav className="mb-6">
          <Link
            href={ROUTES.ADMIN_MEETING(meetingId)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← 모임 관리로 돌아가기
          </Link>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black uppercase tracking-tight">
            데일리 미션 관리
          </h1>
          {pendingCount > 0 && (
            <span className="px-3 py-1 text-sm font-bold border-2 border-foreground bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              대기 {pendingCount}건
            </span>
          )}
        </div>

        {/* 주간 선택 */}
        <div className="mb-6">
          <WeekSelector
            weeks={weeks}
            selectedWeek={selectedWeek}
            currentWeekStart={currentWeekStart}
            baseUrl={ROUTES.ADMIN_MEETING_DAILY(meetingId)}
          />
        </div>

        <DailySubmissionList
          submissions={submissions}
          meetingId={meetingId}
          reviewerId={user.id}
        />
      </main>
    </div>
  );
}
