import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatTeamName } from '@/lib/utils';
import {
  getTeamDetail,
  getTeamPointsHistory,
} from '@/lib/queries/leaderboard';

interface TeamPageProps {
  params: Promise<{ id: string; teamId: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id: meetingId, teamId } = await params;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const [team, history] = await Promise.all([
    getTeamDetail(teamId, meetingId),
    getTeamPointsHistory(teamId),
  ]);

  if (!team) {
    notFound();
  }

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<HeaderActions />} />

      <main className="container mx-auto px-4 py-8">
        {/* 뒤로가기 */}
        <Link
          href={ROUTES.MEETING(meetingId)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          &larr; 모임으로 돌아가기
        </Link>

        {/* 팀 헤더 */}
        <div className="card-brutal mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">
              {formatTeamName(team.team_number, team.name)}
            </h1>
            <div className="text-right">
              <div className="font-mono font-bold text-3xl">
                {team.total_points}
                <span className="text-lg text-muted-foreground">pt</span>
              </div>
            </div>
          </div>

          {/* 멤버 목록 */}
          <div className="flex flex-wrap gap-3">
            {team.members.map((member) => (
              <div key={member.id} className="flex items-center gap-2">
                {member.avatar_url ? (
                  <Image
                    src={member.avatar_url}
                    alt={member.name}
                    width={32}
                    height={32}
                    className="border-2 border-foreground"
                  />
                ) : (
                  <div className="w-8 h-8 border-2 border-foreground bg-muted flex items-center justify-center text-xs font-bold">
                    {member.name.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium">{member.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 포인트 히스토리 */}
        <section>
          <h2 className="text-2xl font-bold uppercase mb-6">포인트 내역</h2>
          {history.length === 0 ? (
            <EmptyState message="아직 포인트 내역이 없습니다" />
          ) : (
            <div className="space-y-3">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="card-brutal flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{record.reason}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {record.mission_title && (
                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 border border-border truncate">
                          {record.mission_title}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(record.created_at).toLocaleDateString(
                          'ko-KR',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }
                        )}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex-shrink-0 font-mono font-bold text-lg ml-4 ${
                      record.amount > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-destructive'
                    }`}
                  >
                    {record.amount > 0 ? '+' : ''}
                    {record.amount}
                    <span className="text-sm text-muted-foreground">pt</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
