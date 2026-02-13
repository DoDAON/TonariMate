import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { LogoutButton } from '@/components/features/auth/LogoutButton';
import { getMissionDetail } from '@/lib/queries/missions';
import Link from 'next/link';

interface MissionPageProps {
  params: Promise<{ id: string; missionId: string }>;
}

const STATUS_CONFIG = {
  upcoming: { label: '시작 전', className: 'bg-muted text-muted-foreground' },
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

  const mission = await getMissionDetail(missionId, meetingId);

  if (!mission) {
    notFound();
  }

  const statusConfig = STATUS_CONFIG[mission.status];
  const remainingDays = mission.status === 'active' ? getRemainingDays(mission.end_date) : null;

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<LogoutButton />} />

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
            {mission.status === 'upcoming' && (
              <p className="mt-4 text-sm text-muted-foreground">
                {formatDate(mission.start_date)}에 미션이 시작됩니다.
              </p>
            )}
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
      </main>
    </div>
  );
}
