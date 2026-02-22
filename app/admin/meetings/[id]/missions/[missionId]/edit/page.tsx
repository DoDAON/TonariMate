import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { LogoutButton } from '@/components/features/auth/LogoutButton';
import { MissionForm } from '@/components/features/admin/MissionForm';
import { requireAdmin } from '@/lib/queries/admin';

interface EditMissionPageProps {
  params: Promise<{ id: string; missionId: string }>;
}

export default async function EditMissionPage({ params }: EditMissionPageProps) {
  const { id, missionId } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  await requireAdmin(user.id);

  const { data: mission, error } = await supabase
    .from('missions')
    .select('title, description, points, start_date, end_date, status')
    .eq('id', missionId)
    .eq('meeting_id', id)
    .single();

  if (error || !mission) {
    notFound();
  }

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<LogoutButton />} />

      <main className="container mx-auto px-4 py-8">
        <nav className="mb-6">
          <Link
            href={ROUTES.ADMIN_MEETING_MISSIONS(id)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← 미션 목록으로 돌아가기
          </Link>
        </nav>

        <h1 className="text-3xl font-black uppercase tracking-tight mb-8">
          미션 수정
        </h1>

        <MissionForm
          meetingId={id}
          mode="edit"
          missionId={missionId}
          defaultValues={mission}
        />
      </main>
    </div>
  );
}
