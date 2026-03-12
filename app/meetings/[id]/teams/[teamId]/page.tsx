import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { EmptyState } from '@/components/shared/EmptyState';
import { WeekSelector } from '@/components/shared/WeekSelector';
import { ImageWithLightbox } from '@/components/features/missions/ImageWithLightbox';
import { formatTeamName } from '@/lib/utils';
import { getTeamDetail, getTeamPointsHistory } from '@/lib/queries/leaderboard';
import {
  getTeamDailySubmissions,
  getWeekStart,
  getTodayStr,
} from '@/lib/queries/daily-submissions';

interface TeamPageProps {
  params: Promise<{ id: string; teamId: string }>;
  searchParams: Promise<{ week?: string }>;
}

const DAILY_STATUS_MAP = {
  pending: { label: '심사 중', className: 'bg-muted text-muted-foreground' },
  approved: { label: '승인', className: 'bg-primary text-primary-foreground' },
  rejected: { label: '반려', className: 'bg-destructive text-destructive-foreground' },
} as const;

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { id: meetingId, teamId } = await params;
  const { week } = await searchParams;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 모임 시작일 조회 (데일리 미션 주 기준)
  const { data: meeting } = await supabase
    .from('meetings')
    .select('start_date')
    .eq('id', meetingId)
    .single();

  const today = getTodayStr();
  const currentWeekStart = getWeekStart(today, meeting?.start_date);
  const selectedWeek = week || currentWeekStart;

  // 지난 4주 목록 생성
  const weeks: string[] = [];
  for (let i = 0; i < 4; i++) {
    const ws = getWeekStart(
      new Date(new Date(today).setDate(new Date(today).getDate() - i * 7))
        .toISOString()
        .split('T')[0],
      meeting?.start_date
    );
    if (!weeks.includes(ws)) weeks.push(ws);
  }

  const [team, history, dailySubmissions] = await Promise.all([
    getTeamDetail(teamId, meetingId),
    getTeamPointsHistory(teamId),
    getTeamDailySubmissions(teamId, selectedWeek),
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

        {/* 데일리 미션 제출 내역 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold uppercase mb-4">데일리 미션</h2>

          {/* 주 선택 */}
          <div className="mb-4">
            <WeekSelector
              weeks={weeks}
              selectedWeek={selectedWeek}
              currentWeekStart={currentWeekStart}
              baseUrl={ROUTES.TEAM(meetingId, teamId)}
            />
          </div>

          {/* 1·2·3 슬롯 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[0, 1, 2].map((idx) => {
              const sub = dailySubmissions[idx] ?? null;
              return (
                <div key={idx} className="border-2 border-foreground p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black font-mono text-2xl">{idx + 1}</span>
                    {sub && (
                      <span
                        className={`px-2 py-0.5 text-xs font-bold uppercase border-2 border-border ${DAILY_STATUS_MAP[sub.status].className}`}
                      >
                        {DAILY_STATUS_MAP[sub.status].label}
                      </span>
                    )}
                  </div>

                  {sub ? (
                    <>
                      {sub.submitter_name && (
                        <p className="text-xs font-bold text-muted-foreground">{sub.submitter_name}</p>
                      )}
                      {sub.image_url && (
                        <div className="relative w-full aspect-video border-2 border-border overflow-hidden bg-muted">
                          <ImageWithLightbox
                            src={sub.image_url}
                            alt={`제출 ${idx + 1}`}
                            fill
                            className="object-cover"
                            containerClassName="relative w-full h-full"
                            sizes="(max-width: 640px) 100vw, 33vw"
                          />
                        </div>
                      )}
                      {sub.completed_at && (
                        <p className="text-xs text-muted-foreground">
                          수행일:{' '}
                          {new Date(sub.completed_at).toLocaleDateString('ko-KR', {
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono">
                        제출: {new Date(sub.submitted_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </p>
                      {sub.note && (
                        <p className="text-sm border-l-2 border-border pl-3 text-muted-foreground">
                          {sub.note}
                        </p>
                      )}
                      {sub.status === 'approved' && (
                        <p className="text-xs font-mono font-bold">+1pt</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">미제출</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

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
                        {new Date(record.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex-shrink-0 font-mono font-bold text-lg ml-4 ${
                      record.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'
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
