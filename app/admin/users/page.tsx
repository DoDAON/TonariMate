import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { HeaderActions } from '@/components/layouts/HeaderActions';
import { requireAdmin, getAllUsers } from '@/lib/queries/admin';
import { AdminUserList } from '@/components/features/admin/AdminUserList';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect(ROUTES.LOGIN);

  await requireAdmin(user.id);

  const users = await getAllUsers();

  return (
    <div className="min-h-screen noise-overlay">
      <Header actions={<HeaderActions />} />

      <main className="container mx-auto px-4 py-8">
        <nav className="mb-6">
          <Link
            href={ROUTES.ADMIN}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← 관리자 대시보드로 돌아가기
          </Link>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            전체 유저 관리
          </h1>
          <span className="text-muted-foreground text-sm font-mono">
            {users.length}명
          </span>
        </div>

        <AdminUserList users={users} currentUserId={user.id} />
      </main>
    </div>
  );
}
