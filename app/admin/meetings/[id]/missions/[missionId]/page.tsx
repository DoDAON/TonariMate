import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { LogoutButton } from '@/components/features/auth/LogoutButton';
import { requireAdmin } from '@/lib/queries/admin';
import { EmptyState } from '@/components/shared/EmptyState';
import { SubmissionReviewCard } from '@/components/features/admin/SubmissionReviewCard';
import { formatTeamName, getEffectiveMissionStatus } from '@/lib/utils';
import type { SubmissionForReview } from '@/components/features/admin/SubmissionReviewCard';

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
    .select('id, title, description, points, start_date, end_date, status')
    .eq('id', missionId)
    .eq('meeting_id', meetingId)
    .single();

  if (mError || !mission) notFound();

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, team_number')
    .eq('meeting_id', meetingId)
    .order('team_number');

  const { data: submissions } = await supabase
    .from('mission_submissions')
    .select('id, team_id, image_url, status, points_awarded, created_at')
    .eq('mission_id', missionId);

  const submissionMap = new Map(submissions?.map((s) => [s.team_id, s]) ?? []);

  const effectiveStatus = getEffectiveMissionStatus(mission.status, mission.end_date);

  const submittedTeams = (teams ?? [])
    .filter((t) => submissionMap.has(t.id))
    .map((t): SubmissionForReview => {
      const s = submissionMap.get(t.id)!;
      return {
        id: s.id,
        image_url: s.image_url,
        status: s.status,
        points_awarded: s.points_awarded,
        created_at: s.created_at,
        mission_points: mission.points,
        team_name: t.name,
        team_number: t.team_number,
      };
    });

  const notSubmittedTeams = (teams ?? []).filter((t) => !submissionMap.has(t.id));

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<LogoutButton />} />

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
              <span className="font-mono text-sm">{mission.points}pt</span>
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
            ({submittedTeams.length}/{(teams ?? []).length}조 제출)
          </span>
        </h2>

        {(teams ?? []).length === 0 ? (
          <EmptyState message="편성된 조가 없습니다" description="조 관리에서 조를 편성해주세요" />
        ) : (
          <div className="space-y-6">
            {/* 미제출 조 요약 */}
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

            {/* 제출된 조 카드 */}
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
