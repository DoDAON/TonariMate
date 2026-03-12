import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { requireAdmin } from '@/lib/queries/admin';
import { InviteCodeDisplay } from '@/components/features/admin/InviteCodeDisplay';

interface AdminMeetingPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminMeetingPage({ params }: AdminMeetingPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect(ROUTES.LOGIN);

  await requireAdmin(user.id);

  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !meeting) notFound();

  const [membersResult, teamsResult, missionsResult] = await Promise.all([
    supabase.from('meeting_members').select('*', { count: 'exact', head: true }).eq('meeting_id', id),
    supabase.from('teams').select('*', { count: 'exact', head: true }).eq('meeting_id', id),
    supabase.from('missions').select('*', { count: 'exact', head: true }).eq('meeting_id', id),
  ]);

  const navItems = [
    { label: '모임 수정', href: ROUTES.ADMIN_MEETING_EDIT(id) },
    { label: `조 관리 (${teamsResult.count ?? 0}조)`, href: ROUTES.ADMIN_MEETING_TEAMS(id) },
    { label: `주간 미션 관리 (${missionsResult.count ?? 0})`, href: ROUTES.ADMIN_MEETING_MISSIONS(id) },
    { label: '데일리 미션 관리', href: ROUTES.ADMIN_MEETING_DAILY(id) },
    { label: '공지사항 관리', href: ROUTES.ADMIN_MEETING_ANNOUNCEMENTS(id) },
  ];

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<HeaderActions />} />

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
          <div className="flex items-start justify-between mb-4 gap-3">
            <h1 className="text-3xl font-black uppercase tracking-tight">{meeting.name}</h1>
            <span
              className={`px-2 py-0.5 text-xs font-bold uppercase border-2 border-border shrink-0 ${
                meeting.is_active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {meeting.is_active ? '진행 중' : '종료'}
            </span>
          </div>

          <p className="text-sm text-muted-foreground font-mono mb-2">{meeting.period}</p>

          {meeting.description && (
            <p className="text-sm text-muted-foreground mb-4">{meeting.description}</p>
          )}

          <div className="flex gap-4 text-sm font-mono">
            <span>{membersResult.count ?? 0}명 참여</span>
            <span>{teamsResult.count ?? 0}조</span>
            <span>{missionsResult.count ?? 0}미션</span>
          </div>
        </div>

        {/* 초대코드 */}
        <div className="card-brutal mb-6">
          <h2 className="text-lg font-black uppercase tracking-tight mb-3">초대코드</h2>
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
