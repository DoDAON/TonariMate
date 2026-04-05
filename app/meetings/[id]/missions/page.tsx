import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { getMeetingMissions } from '@/lib/queries/missions';
import { getUserTeamInMeeting } from '@/lib/queries/teams';
import Link from 'next/link';

interface MissionsPageProps {
  params: Promise<{ id: string }>;
}

const SUBMISSION_STATUS_MAP = {
  pending: { label: '승인 대기', className: 'bg-amber-400 text-amber-900 border-amber-500' },
  approved: { label: '승인됨', className: 'bg-primary text-primary-foreground border-primary' },
  rejected: { label: '반려됨', className: 'bg-destructive text-destructive-foreground border-destructive' },
} as const;

export default async function CompletedMissionsPage({ params }: MissionsPageProps) {
  const { id: meetingId } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const { data: membership } = await supabase
    .from('meeting_members')
    .select('role')
    .eq('meeting_id', meetingId)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    redirect(ROUTES.MY);
  }

  const team = await getUserTeamInMeeting(meetingId, user.id);
  const missions = await getMeetingMissions(meetingId, team?.id);
  const completed = missions.completed;

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

        <h1 className="text-2xl font-black tracking-tight uppercase mb-6">
          완료된 주간미션
        </h1>

        {completed.length === 0 ? (
          <div className="card-brutal bg-muted">
            <p className="text-sm text-muted-foreground">완료된 미션이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {completed.map((mission) => {
              const submissionStatus = mission.teamSubmissionStatus
                ? SUBMISSION_STATUS_MAP[mission.teamSubmissionStatus]
                : null;
              return (
                <Link key={mission.id} href={ROUTES.MISSION(meetingId, mission.id)} className="block">
                  <div className="card-brutal transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:[box-shadow:var(--shadow-brutal-lg)] active:translate-x-[2px] active:translate-y-[2px] active:[box-shadow:var(--shadow-brutal-sm)]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold truncate">{mission.title}</h4>
                          {mission.mission_type === 'team_naming' && (
                            <span className="text-xs font-bold border border-border px-1.5 py-0.5 bg-muted shrink-0">
                              조 이름
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-1">
                          {mission.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-mono font-bold whitespace-nowrap">
                          {mission.mission_type === 'team_naming' ? '10pt' : `${mission.points}pt`}
                        </span>
                        {submissionStatus && (
                          <span className={`px-2 py-0.5 text-xs font-bold border ${submissionStatus.className}`}>
                            {submissionStatus.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs font-mono mt-2 break-all">
                      {mission.start_date} ~ {mission.end_date}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
