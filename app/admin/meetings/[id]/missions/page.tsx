import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { requireAdmin } from '@/lib/queries/admin';
import { EmptyState } from '@/components/shared/EmptyState';
import { AdminMissionList } from '@/components/features/admin/AdminMissionList';

interface MissionsPageProps {
  params: Promise<{ id: string }>;
}

export default async function MissionsPage({ params }: MissionsPageProps) {
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
    .select('name')
    .eq('id', id)
    .single();

  if (error || !meeting) {
    notFound();
  }

  const { data: missions } = await supabase
    .from('missions')
    .select('id, title, points, start_date, end_date, status')
    .eq('meeting_id', id)
    .order('start_date', { ascending: false });

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<HeaderActions />} />

      <main className="container mx-auto px-4 py-8">
        <nav className="mb-6">
          <Link
            href={ROUTES.ADMIN_MEETING(id)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← {meeting.name} 관리로 돌아가기
          </Link>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            미션 관리
          </h1>
          <Link href={ROUTES.ADMIN_MEETING_MISSION_NEW(id)} className="btn-brutal">
            + 미션 생성
          </Link>
        </div>

        {!missions || missions.length === 0 ? (
          <EmptyState
            message="아직 미션이 없습니다"
            description="미션을 생성하여 시작하세요"
          />
        ) : (
          <AdminMissionList missions={missions} meetingId={id} />
        )}
      </main>
    </div>
  );
}
