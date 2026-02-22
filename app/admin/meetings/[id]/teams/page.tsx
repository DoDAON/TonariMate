import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { LogoutButton } from '@/components/features/auth/LogoutButton';
import { requireAdmin } from '@/lib/queries/admin';
import { getAdminTeams, getUnassignedMembers } from '@/lib/queries/admin-teams';
import { TeamManagement } from '@/components/features/admin/TeamManagement';

interface TeamManagementPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamManagementPage({ params }: TeamManagementPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  await requireAdmin(user.id);

  // 모임 존재 확인
  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('name')
    .eq('id', id)
    .single();

  if (error || !meeting) {
    notFound();
  }

  const [teams, unassignedMembers] = await Promise.all([
    getAdminTeams(id),
    getUnassignedMembers(id),
  ]);

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<LogoutButton />} />

      <main className="container mx-auto px-4 py-8">
        <nav className="mb-6">
          <Link
            href={ROUTES.ADMIN_MEETING(id)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← {meeting.name} 관리로 돌아가기
          </Link>
        </nav>

        <h1 className="text-3xl font-black uppercase tracking-tight mb-8">
          팀 관리
        </h1>

        <TeamManagement
          meetingId={id}
          teams={teams}
          unassignedMembers={unassignedMembers}
        />
      </main>
    </div>
  );
}
