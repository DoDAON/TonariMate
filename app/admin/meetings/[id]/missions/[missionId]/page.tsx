import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { requireAdmin } from '@/lib/queries/admin';
import { EmptyState } from '@/components/shared/EmptyState';
import { SubmissionReviewCard } from '@/components/features/admin/SubmissionReviewCard';
import { IndividualTeamAccordion } from '@/components/features/admin/IndividualTeamAccordion';
import { formatTeamName, getEffectiveMissionStatus } from '@/lib/utils';
import type { SubmissionForReview } from '@/components/features/admin/SubmissionReviewCard';
import type { IndividualTeamData } from '@/components/features/admin/IndividualTeamAccordion';

interface MissionDetailPageProps {
  params: Promise<{ id: string; missionId: string }>;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function AdminMissionDetailPage({ params }: MissionDetailPageProps) {
  const { id: meetingId, missionId } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect(ROUTES.LOGIN);

  await requireAdmin(user.id);

  const { data: mission, error: mError } = await supabase
    .from('missions')
    .select('id, title, description, points, start_date, end_date, status, mission_type')
    .eq('id', missionId)
    .eq('meeting_id', meetingId)
    .single();

  if (mError || !mission) notFound();

  // 팀 + 멤버 수 조회
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, team_number')
    .eq('meeting_id', meetingId)
    .order('team_number');

  // 팀별 멤버 수 조회
  const teamIds = (teams ?? []).map((t) => t.id);
  const memberCountMap = new Map<string, number>();
  if (teamIds.length > 0) {
    const { data: memberCounts } = await supabase
      .from('team_members')
      .select('team_id')
      .in('team_id', teamIds);
    for (const row of memberCounts ?? []) {
      memberCountMap.set(row.team_id, (memberCountMap.get(row.team_id) ?? 0) + 1);
    }
  }

  // 제출물 + 제출자 이름 조회
  const { data: submissions } = await supabase
    .from('mission_submissions')
    .select('id, team_id, image_url, text_content, note, completed_at, status, points_awarded, created_at, submitted_by, rejection_reason, submitter:users!mission_submissions_submitted_by_fkey(name), reviewer:users!mission_submissions_reviewed_by_fkey(name)')
    .eq('mission_id', missionId);

  const effectiveStatus = getEffectiveMissionStatus(mission.status, mission.end_date);
  const isIndividual = mission.mission_type === 'individual';

  // 개인 미션 데이터 구조
  let individualTeams: IndividualTeamData[] = [];
  let individualNotSubmittedTeams: typeof teams = [];

  // 팀 미션 데이터 구조
  let submittedTeams: SubmissionForReview[] = [];
  let notSubmittedTeams: typeof teams = [];

  if (isIndividual) {
    // 개인 미션: 팀별로 제출물 그룹핑
    const submissionsByTeam = new Map<string, typeof submissions>([]);
    for (const s of submissions ?? []) {
      const list = submissionsByTeam.get(s.team_id) ?? [];
      list.push(s);
      submissionsByTeam.set(s.team_id, list);
    }

    individualTeams = (teams ?? [])
      .filter((t) => submissionsByTeam.has(t.id))
      .map((t): IndividualTeamData => ({
        teamId: t.id,
        teamName: t.name,
        teamNumber: t.team_number,
        totalMembers: memberCountMap.get(t.id) ?? 0,
        submissions: (submissionsByTeam.get(t.id) ?? []).map((s) => ({
          id: s.id,
          submittedByName: (s.submitter as unknown as { name: string } | null)?.name ?? null,
          submittedById: s.submitted_by,
          imageUrl: s.image_url,
          note: s.note,
          completedAt: s.completed_at,
          status: s.status,
          pointsAwarded: s.points_awarded,
          createdAt: s.created_at,
          rejectionReason: s.rejection_reason,
          reviewedByName: (s.reviewer as unknown as { name: string } | null)?.name ?? null,
        })),
      }));

    individualNotSubmittedTeams = (teams ?? []).filter((t) => !submissionsByTeam.has(t.id));
  } else {
    // 팀 미션: 기존 로직
    const submissionMap = new Map(submissions?.map((s) => [s.team_id, s]) ?? []);

    submittedTeams = (teams ?? [])
      .filter((t) => submissionMap.has(t.id))
      .map((t): SubmissionForReview => {
        const s = submissionMap.get(t.id)!;
        return {
          id: s.id,
          image_url: s.image_url,
          text_content: s.text_content,
          note: s.note,
          completed_at: s.completed_at,
          status: s.status,
          points_awarded: s.points_awarded,
          created_at: s.created_at,
          mission_type: mission.mission_type,
          team_name: t.name,
          team_number: t.team_number,
          member_count: memberCountMap.get(t.id) ?? 0,
          submitted_by_name: (s.submitter as unknown as { name: string } | null)?.name ?? null,
          reviewed_by_name: (s.reviewer as unknown as { name: string } | null)?.name ?? null,
        };
      });

    notSubmittedTeams = (teams ?? []).filter((t) => !submissionMap.has(t.id));
  }

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<HeaderActions />} />

      <main className="container mx-auto px-4 py-8">
        <nav className="mb-6">
          <Link
            href={ROUTES.ADMIN_MEETING_MISSIONS(meetingId)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← 미션 목록으로 돌아가기
          </Link>
        </nav>

        {/* 미션 정보 */}
        <div className="card-brutal mb-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 text-xs font-bold uppercase border-2 border-border ${
                  effectiveStatus === 'active'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {effectiveStatus === 'active' ? '진행 중' : '종료'}
              </span>
              <span className="px-2 py-0.5 text-xs font-bold border-2 border-border bg-muted">
                {mission.mission_type === 'team_naming'
                  ? '조 이름 정하기'
                  : mission.mission_type === 'individual'
                    ? '개인 미션'
                    : '일반'}
              </span>
              {mission.mission_type === 'weekly' && (
                <span className="font-mono text-sm">{mission.points}pt</span>
              )}
              {mission.mission_type === 'individual' && (
                <span className="font-mono text-sm">{mission.points}pt / 인</span>
              )}
            </div>
            <Link
              href={ROUTES.ADMIN_MEETING_MISSION_EDIT(meetingId, missionId)}
              className="btn-brutal bg-muted text-foreground text-sm"
            >
              수정
            </Link>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight mb-2">{mission.title}</h1>
          <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{mission.description}</p>
          <p className="text-sm font-mono text-muted-foreground">
            {formatDate(mission.start_date)} ~ {formatDate(mission.end_date)}
          </p>
        </div>

        {/* 제출 현황 */}
        <h2 className="text-xl font-black uppercase tracking-tight mb-4">
          제출 현황{' '}
          <span className="font-mono text-base font-normal text-muted-foreground">
            {isIndividual
              ? `(${individualTeams.length}/${(teams ?? []).length}조 제출)`
              : `(${submittedTeams.length}/${(teams ?? []).length}조 제출)`}
          </span>
        </h2>

        {(teams ?? []).length === 0 ? (
          <EmptyState message="편성된 조가 없습니다" description="조 관리에서 조를 편성해주세요" />
        ) : isIndividual ? (
          /* 개인 미션: 아코디언 뷰 */
          <div className="space-y-6">
            {individualNotSubmittedTeams.length > 0 && (
              <div className="card-brutal">
                <h3 className="font-black mb-2 text-muted-foreground">미제출 ({individualNotSubmittedTeams.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {individualNotSubmittedTeams.map((t) => (
                    <span
                      key={t.id}
                      className="px-2 py-0.5 text-sm font-bold border-2 border-border bg-muted"
                    >
                      {formatTeamName(t.team_number, t.name)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {individualTeams.length > 0 && (
              <div>
                <h3 className="font-black mb-3">제출된 조 ({individualTeams.length})</h3>
                <div className="space-y-2">
                  {individualTeams.map((team) => (
                    <IndividualTeamAccordion
                      key={team.teamId}
                      team={team}
                      meetingId={meetingId}
                      missionId={missionId}
                      missionPoints={mission.points}
                      reviewerId={user.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {individualTeams.length === 0 && (
              <p className="text-sm text-muted-foreground">아직 제출한 조가 없습니다.</p>
            )}
          </div>
        ) : (
          /* 팀 미션: 기존 카드 뷰 */
          <div className="space-y-6">
            {notSubmittedTeams.length > 0 && (
              <div className="card-brutal">
                <h3 className="font-black mb-2 text-muted-foreground">미제출 ({notSubmittedTeams.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {notSubmittedTeams.map((t) => (
                    <span
                      key={t.id}
                      className="px-2 py-0.5 text-sm font-bold border-2 border-border bg-muted"
                    >
                      {formatTeamName(t.team_number, t.name)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {submittedTeams.length > 0 && (
              <div>
                <h3 className="font-black mb-3">제출된 조 ({submittedTeams.length})</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {submittedTeams.map((s) => (
                    <SubmissionReviewCard
                      key={s.id}
                      submission={s}
                      meetingId={meetingId}
                      missionId={missionId}
                      reviewerId={user.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {submittedTeams.length === 0 && (
              <p className="text-sm text-muted-foreground">아직 제출한 조가 없습니다.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
