import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { LogoutButton } from '@/components/features/auth/LogoutButton';

export async function HeaderActions() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  let isAdmin = false;
  if (session?.user) {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    isAdmin = data?.role === 'admin';
  }

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Link
          href={ROUTES.ADMIN}
          className="px-4 py-2 text-sm font-bold uppercase border-2 border-foreground hover:bg-foreground hover:text-background transition-colors touch-target"
        >
          관리자
        </Link>
      )}
      <LogoutButton />
    </div>
  );
}
