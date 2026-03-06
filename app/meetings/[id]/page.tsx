import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { getMeetingDetail } from '@/lib/queries/meetings';
import { getUserTeamInMeeting } from '@/lib/queries/teams';
import { getMeetingMissions } from '@/lib/queries/missions';
import Link from 'next/link';
import { MeetingInfo } from '@/components/features/meetings/MeetingInfo';
import { TeamCard } from '@/components/features/meetings/TeamCard';
import { MissionSection } from '@/components/features/meetings/MissionSection';
import { LeaderboardSection } from '@/components/features/leaderboard/LeaderboardSection';

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

  // 팀과 미션을 병렬 조회
  const [team, missions] = await Promise.all([
    getUserTeamInMeeting(id, userId),
    getMeetingMissions(id),
  ]);

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
          <MissionSection missions={missions} meetingId={id} />
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
