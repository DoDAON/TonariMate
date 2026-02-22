import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { LogoutButton } from '@/components/features/auth/LogoutButton';
import { MissionForm } from '@/components/features/admin/MissionForm';
import { requireAdmin } from '@/lib/queries/admin';

interface NewMissionPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewMissionPage({ params }: NewMissionPageProps) {
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
          미션 생성
        </h1>

        <MissionForm meetingId={id} mode="create" />
      </main>
    </div>
  );
}
