import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { getMeetingDetail } from '@/lib/queries/meetings';
import { getUserTeamInMeeting } from '@/lib/queries/teams';
import { getMeetingMissions } from '@/lib/queries/missions';
import {
  getUserTodayDailySubmission,
  getUserWeeklyDailyCount,
  getWeekStart,
  getTodayStr,
} from '@/lib/queries/daily-submissions';
import { getMeetingAnnouncements } from '@/lib/queries/announcements';
import Link from 'next/link';
import { MeetingInfo } from '@/components/features/meetings/MeetingInfo';
import { TeamCard } from '@/components/features/meetings/TeamCard';
import { WeeklyMissionSection } from '@/components/features/meetings/MissionSection';
import { DailyMissionStatus } from '@/components/features/missions/DailyMissionStatus';
import { LeaderboardSection } from '@/components/features/leaderboard/LeaderboardSection';
import { AnnouncementSection } from '@/components/features/meetings/AnnouncementSection';

interface MeetingPageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingPage({ params }: MeetingPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const userId = user.id;

  const meeting = await getMeetingDetail(id, userId);

  if (!meeting) {
    notFound();
  }

  const today = getTodayStr();
  const weekStart = getWeekStart(today, meeting.start_date);

  // 팀, 미션, 공지사항 병렬 조회
  const [team, missions, announcements] = await Promise.all([
    getUserTeamInMeeting(id, userId),
    getMeetingMissions(id),
    getMeetingAnnouncements(id),
  ]);

  // 데일리 미션 데이터 (팀이 있는 경우만)
  const [todayDailySubmission, weeklyDailyCount] = team
    ? await Promise.all([
        getUserTodayDailySubmission(id, userId),
        getUserWeeklyDailyCount(id, userId, weekStart),
      ])
    : [null, 0];

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<HeaderActions />} />

      <main className="container mx-auto px-4 py-8">
        <nav className="mb-6">
          <Link
            href={ROUTES.MY}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← 내 모임으로 돌아가기
          </Link>
        </nav>

        <MeetingInfo meeting={meeting} />

        {/* 공지사항 */}
        {announcements.length > 0 && (
          <section className="mt-8">
            <h2 className="text-2xl font-bold uppercase mb-6">공지사항</h2>
            <AnnouncementSection announcements={announcements} />
          </section>
        )}

        {/* 내 조 */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold uppercase mb-6">내 조</h2>
          {team ? (
            <Link href={ROUTES.TEAM(id, team.id)}>
              <TeamCard team={team} />
            </Link>
          ) : (
            <div className="card-brutal opacity-60">
              <p className="text-muted-foreground text-sm">
                아직 배정된 조가 없습니다.
              </p>
            </div>
          )}
        </section>

        {/* 미션 */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold uppercase mb-6">미션</h2>

          {/* 데일리 미션 */}
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3">데일리 미션</h3>
            <DailyMissionStatus
              meetingId={id}
              todaySubmission={todayDailySubmission}
              weeklyCount={weeklyDailyCount}
              meetingActive={meeting.is_active}
              hasTeam={!!team}
            />
          </div>

          {/* 주간 미션 */}
          <div>
            <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3">주간 미션</h3>
            <WeeklyMissionSection missions={missions} meetingId={id} />
          </div>
        </section>

        {/* 리더보드 */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold uppercase mb-6">전체 조</h2>
          <LeaderboardSection meetingId={id} currentTeamId={team?.id} />
        </section>
      </main>
    </div>
  );
}
