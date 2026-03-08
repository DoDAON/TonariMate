import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { getMissionDetail, getTeamSubmission } from '@/lib/queries/missions';
import { getUserTeamInMeeting } from '@/lib/queries/teams';
import MissionSubmissionForm from '@/components/features/missions/MissionSubmissionForm';
import SubmissionStatus from '@/components/features/missions/SubmissionStatus';
import Link from 'next/link';

interface MissionPageProps {
  params: Promise<{ id: string; missionId: string }>;
}

const STATUS_CONFIG = {
  active: { label: '진행 중', className: 'bg-primary text-primary-foreground' },
  completed: { label: '종료', className: 'bg-muted text-muted-foreground' },
} as const;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getRemainingDays(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function MissionPage({ params }: MissionPageProps) {
  const { id: meetingId, missionId } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const [mission, meetingResult] = await Promise.all([
    getMissionDetail(missionId, meetingId),
    supabase.from('meetings').select('is_active').eq('id', meetingId).single(),
  ]);

  if (!mission) {
    notFound();
  }

  const meetingEnded = !meetingResult.data?.is_active;

  const team = await getUserTeamInMeeting(meetingId, user.id);
  const submission = team ? await getTeamSubmission(missionId, team.id) : null;

  const statusConfig = STATUS_CONFIG[mission.status];
  const remainingDays = mission.status === 'active' ? getRemainingDays(mission.end_date) : null;

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<HeaderActions />} />

      <main className="container mx-auto px-4 py-8">
        {/* 뒤로가기 */}
        <nav className="mb-6">
          <Link
            href={ROUTES.MEETING(meetingId)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← 모임으로 돌아가기
          </Link>
        </nav>

        <article className="card-brutal">
          {/* 헤더: 상태 배지 + 포인트 */}
          <div className="flex items-center justify-between mb-4">
            <span className={`px-3 py-1 text-xs font-bold uppercase border-2 border-border ${statusConfig.className}`}>
              {statusConfig.label}
            </span>
            <span className="font-mono font-bold">{mission.points}pt</span>
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-black tracking-tight uppercase mb-4">
            {mission.title}
          </h1>

          {/* 설명 */}
          <p className="text-muted-foreground whitespace-pre-wrap mb-6">
            {mission.description}
          </p>

          {/* 기간 */}
          <div className="border-t-2 border-border pt-4">
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">시작일</dt>
                <dd className="font-mono">{formatDate(mission.start_date)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">종료일</dt>
                <dd className="font-mono">{formatDate(mission.end_date)}</dd>
              </div>
            </dl>

            {/* 상태별 추가 정보 */}
            {mission.status === 'active' && remainingDays !== null && (
              <p className="mt-4 text-sm font-bold">
                {remainingDays > 0
                  ? `마감까지 ${remainingDays}일 남음`
                  : '오늘 마감'}
              </p>
            )}
            {mission.status === 'completed' && (
              <p className="mt-4 text-sm text-muted-foreground">
                {formatDate(mission.end_date)}에 종료된 미션입니다.
              </p>
            )}
          </div>
        </article>

        {/* 미션 제출 섹션 */}
        <section className="mt-6 card-brutal">
          <h2 className="text-lg font-black tracking-tight uppercase mb-4">
            미션 제출
          </h2>

          {submission ? (
            <>
              <SubmissionStatus submission={submission} />
              {meetingEnded && (
                <p className="mt-3 text-xs text-muted-foreground">
                  종료된 모임입니다.
                </p>
              )}
            </>
          ) : meetingEnded ? (
            <p className="text-sm text-muted-foreground">
              종료된 모임입니다. 미션 제출이 불가합니다.
            </p>
          ) : !team ? (
            <p className="text-sm text-muted-foreground">
              팀 배정 후 제출 가능합니다.
            </p>
          ) : mission.status === 'active' ? (
            <MissionSubmissionForm
              missionId={missionId}
              meetingId={meetingId}
              teamId={team.id}
              userId={user.id}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              종료된 미션입니다.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
