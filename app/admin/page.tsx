import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { EmptyState } from '@/components/shared/EmptyState';
import { AdminMeetingCard } from '@/components/features/admin/AdminMeetingCard';
import { requireAdmin, getAdminMeetings, getAllUsers } from '@/lib/queries/admin';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  await requireAdmin(user.id);

  const [meetings, users] = await Promise.all([
    getAdminMeetings(),
    getAllUsers(),
  ]);

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<HeaderActions />} />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-8">
          관리자 대시보드
        </h1>

        {/* 전체 유저 관리 섹션 */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black uppercase tracking-tight">전체 유저 관리</h2>
            <Link href={ROUTES.ADMIN_USERS} className="btn-brutal bg-muted text-foreground text-sm">
              유저 관리 →
            </Link>
          </div>
          <div className="card-brutal">
            <p className="text-muted-foreground text-sm">
              전체 가입 유저: <span className="font-bold text-foreground">{users.length}명</span>
              {' · '}
              관리자: <span className="font-bold text-foreground">{users.filter((u) => u.role === 'admin').length}명</span>
            </p>
          </div>
        </section>

        {/* 모임 섹션 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black uppercase tracking-tight">모임 관리</h2>
          <Link href={ROUTES.ADMIN_MEETING_NEW} className="btn-brutal">
            + 모임 생성
          </Link>
        </div>

        {meetings.length === 0 ? (
          <EmptyState
            message="아직 모임이 없습니다"
            description="모임을 생성하여 시작하세요"
          />
        ) : (
          <div className="grid gap-4">
            {meetings.map((meeting) => (
              <AdminMeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
