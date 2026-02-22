import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { LogoutButton } from '@/components/features/auth/LogoutButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { AdminMeetingCard } from '@/components/features/admin/AdminMeetingCard';
import { requireAdmin, getAdminMeetings } from '@/lib/queries/admin';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  await requireAdmin(user.id);

  const meetings = await getAdminMeetings();

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<LogoutButton />} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            관리자 대시보드
          </h1>
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
