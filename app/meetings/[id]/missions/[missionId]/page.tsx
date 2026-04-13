import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { getMissionDetail, getTeamSubmission, getMyIndividualSubmission, getTeamIndividualSubmissions } from '@/lib/queries/missions';
import { getUserTeamInMeeting } from '@/lib/queries/teams';
import { SUBMISSION_STATUS_MAP } from '@/lib/constants/missions';
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
  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(endDate).getTime() - new Date(todayKST).getTime()) / msPerDay);
}

export default async function MissionPage({ params }: MissionPageProps) {
  const { id: meetingId, missionId } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 멤버십 확인
  const { data: membership } = await supabase
    .from('meeting_members')
    .select('role')
    .eq('meeting_id', meetingId)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    redirect(ROUTES.MY);
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

  const isIndividualMission = mission.mission_type === 'individual';

  const [submission, teamIndividualSubmissions] = await Promise.all([
    team
      ? isIndividualMission
        ? getMyIndividualSubmission(missionId, team.id, user.id)
        : getTeamSubmission(missionId, team.id)
      : Promise.resolve(null),
    team && isIndividualMission
      ? getTeamIndividualSubmissions(missionId, team.id)
      : Promise.resolve([]),
  ]);

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
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs font-bold uppercase border-2 border-border ${statusConfig.className}`}>
                {statusConfig.label}
              </span>
              {mission.mission_type === 'team_naming' && (
                <span className="px-2 py-1 text-xs font-bold border-2 border-border bg-muted">
                  조 이름 정하기
                </span>
              )}
              {mission.mission_type === 'individual' && (
                <span className="px-2 py-1 text-xs font-bold border-2 border-border bg-muted">
                  개인 미션
                </span>
              )}
            </div>
            <span className="font-mono font-bold">
              {mission.mission_type === 'individual'
                ? `${mission.points}pt / 인`
                : mission.mission_type === 'team_naming'
                  ? '10pt'
                  : `${mission.points}pt`}
            </span>
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
            {isIndividualMission ? '내 제출' : '미션 제출'}
          </h2>

          {submission ? (
            <>
              <SubmissionStatus
                submission={submission}
                missionId={missionId}
                meetingId={meetingId}
                teamId={team?.id ?? ''}
                userId={user.id}
                missionType={mission.mission_type}
                missionActive={mission.status === 'active' && !meetingEnded}
                missionStartDate={mission.start_date}
                missionEndDate={mission.end_date}
              />
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
              missionType={mission.mission_type}
              startDate={mission.start_date}
              endDate={mission.end_date}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              종료된 미션입니다.
            </p>
          )}
        </section>

        {/* 개인 미션: 팀원 제출 현황 */}
        {isIndividualMission && team && teamIndividualSubmissions.filter((m) => m.userId !== user.id).length > 0 && (
          <section className="mt-6 card-brutal">
            <h2 className="text-lg font-black tracking-tight uppercase mb-4">
              팀원 제출 현황{' '}
              <span className="font-mono text-base font-normal text-muted-foreground">
                ({teamIndividualSubmissions.filter((m) => m.submission).length}/{teamIndividualSubmissions.length}명 제출)
              </span>
            </h2>
            <div className="space-y-4">
              {teamIndividualSubmissions.filter((m) => m.userId !== user.id).map((member) => {
                const s = member.submission;
                const statusInfo = s ? SUBMISSION_STATUS_MAP[s.status] : null;
                return (
                  <div key={member.userId} className="border-2 border-border p-3 space-y-2">
                    {/* 이름 + 상태 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">
                        {member.userName}
                        {member.userId === user.id && (
                          <span className="ml-1.5 text-xs text-muted-foreground font-normal">(나)</span>
                        )}
                      </span>
                      {statusInfo ? (
                        <span className={`px-2 py-0.5 text-xs font-bold border-2 ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">미제출</span>
                      )}
                    </div>

                    {/* 제출물 내용 */}
                    {s && (
                      <>
                        {s.image_url && (
                          <div className="border-2 border-border p-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={s.image_url}
                              alt={`${member.userName} 제출 이미지`}
                              className="w-full max-h-48 object-contain"
                            />
                          </div>
                        )}
                        {s.completed_at && (
                          <p className="text-xs text-muted-foreground">
                            수행일:{' '}
                            {new Date(s.completed_at).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                        {s.note && (
                          <p className="text-sm border-l-2 border-border pl-3 text-muted-foreground">
                            {s.note}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
