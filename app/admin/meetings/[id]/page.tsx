import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { LogoutButton } from '@/components/features/auth/LogoutButton';
import { requireAdmin } from '@/lib/queries/admin';
import { InviteCodeDisplay } from '@/components/features/admin/InviteCodeDisplay';
import { ToggleActiveButton } from '@/components/features/admin/ToggleActiveButton';

interface AdminMeetingPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminMeetingPage({ params }: AdminMeetingPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  await requireAdmin(user.id);

  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !meeting) {
    notFound();
  }

  // 통계 병렬 조회
  const [membersResult, teamsResult, missionsResult, submissionsResult] = await Promise.all([
    supabase.from('meeting_members').select('*', { count: 'exact', head: true }).eq('meeting_id', id),
    supabase.from('teams').select('*', { count: 'exact', head: true }).eq('meeting_id', id),
    supabase.from('missions').select('*', { count: 'exact', head: true }).eq('meeting_id', id),
    supabase.from('mission_submissions').select('id, status, missions!inner(meeting_id)').eq('missions.meeting_id', id),
  ]);

  const pendingCount = submissionsResult.data?.filter((s) => s.status === 'pending').length ?? 0;

  const navItems = [
    { label: '모임 수정', href: ROUTES.ADMIN_MEETING_EDIT(id) },
    { label: `팀 관리 (${teamsResult.count ?? 0})`, href: ROUTES.ADMIN_MEETING_TEAMS(id) },
    { label: `미션 관리 (${missionsResult.count ?? 0})`, href: ROUTES.ADMIN_MEETING_MISSIONS(id) },
    { label: `제출물 심사${pendingCount > 0 ? ` (${pendingCount}건 대기)` : ''}`, href: ROUTES.ADMIN_MEETING_SUBMISSIONS(id) },
  ];

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<LogoutButton />} />

      <main className="container mx-auto px-4 py-8">
        <nav className="mb-6">
          <Link
            href={ROUTES.ADMIN}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← 대시보드로 돌아가기
          </Link>
        </nav>

        {/* 모임 정보 */}
        <div className="card-brutal mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-black uppercase tracking-tight">
              {meeting.name}
            </h1>
            <ToggleActiveButton meetingId={id} isActive={meeting.is_active} />
          </div>

          <p className="text-sm text-muted-foreground font-mono mb-2">
            {meeting.period}
          </p>

          {meeting.description && (
            <p className="text-sm text-muted-foreground mb-4">
              {meeting.description}
            </p>
          )}

          <div className="flex gap-4 text-sm font-mono">
            <span>{membersResult.count ?? 0}명 참여</span>
            <span>{teamsResult.count ?? 0}팀</span>
            <span>{missionsResult.count ?? 0}미션</span>
          </div>
        </div>

        {/* 초대코드 */}
        <div className="card-brutal mb-6">
          <h2 className="text-lg font-black uppercase tracking-tight mb-3">
            초대코드
          </h2>
          <InviteCodeDisplay meetingId={id} inviteCode={meeting.invite_code} />
        </div>

        {/* 관리 네비게이션 */}
        <div className="grid gap-3">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="card-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer flex items-center justify-between">
                <span className="font-bold">{item.label}</span>
                <span className="text-muted-foreground">→</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
