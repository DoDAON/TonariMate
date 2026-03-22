import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { getUserTeamInMeeting } from '@/lib/queries/teams';
import { getUserTodayDailySubmission, getUserWeeklyDailyCount, getWeekStart, getTodayStr } from '@/lib/queries/daily-submissions';
import DailyMissionSection from '@/components/features/missions/DailyMissionSection';

interface DailyPageProps {
  params: Promise<{ id: string }>;
}

export default async function DailyMissionPage({ params }: DailyPageProps) {
  const { id: meetingId } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect(ROUTES.LOGIN);

  // 멤버십 확인
  const { data: membership } = await supabase
    .from('meeting_members')
    .select('role')
    .eq('meeting_id', meetingId)
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect(ROUTES.MY);

  // 모임 활성 여부 + 시작일
  const { data: meeting } = await supabase
    .from('meetings')
    .select('is_active, name, start_date')
    .eq('id', meetingId)
    .single();

  if (!meeting?.is_active) redirect(ROUTES.MEETING(meetingId));

  const today = getTodayStr();
  if (meeting.start_date && today < meeting.start_date) redirect(ROUTES.MEETING(meetingId));

  const team = await getUserTeamInMeeting(meetingId, user.id);
  if (!team) redirect(ROUTES.MEETING(meetingId));

  const weekStart = getWeekStart(today, meeting.start_date);

  const [todaySubmission, weeklyCount] = await Promise.all([
    getUserTodayDailySubmission(meetingId, user.id),
    getUserWeeklyDailyCount(meetingId, user.id, weekStart),
  ]);

  // 이미 오늘 제출했거나 주 5회 완료시 모임 페이지로 리다이렉트
  if (todaySubmission || weeklyCount >= 5) {
    redirect(ROUTES.MEETING(meetingId));
  }

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<HeaderActions />} />

      <main className="container mx-auto px-4 py-8">
        <nav className="mb-6">
          <Link
            href={ROUTES.MEETING(meetingId)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← 모임으로 돌아가기
          </Link>
        </nav>

        <article className="card-brutal mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 text-xs font-bold uppercase border-2 border-border bg-primary text-primary-foreground">
              데일리 미션
            </span>
            <span className="font-mono font-bold">3pt</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase mb-2">오늘의 데일리 미션</h1>
          <p className="text-sm text-muted-foreground">
            이번 주 진행 상황: {weeklyCount}/5회
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            하루 1회 · 주 최대 5회 · 3pt 고정 · 월~일 기준
          </p>
        </article>

        <section className="card-brutal">
          <h2 className="text-lg font-black tracking-tight uppercase mb-4">미션 제출</h2>
          <DailyMissionSection
            meetingId={meetingId}
            teamId={team.id}
            userId={user.id}
            todaySubmission={null}
            weeklyCount={weeklyCount}
          />
        </section>
      </main>
    </div>
  );
}
