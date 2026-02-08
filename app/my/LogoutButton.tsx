'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/constants/routes';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(ROUTES.HOME);
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm font-bold uppercase border-2 border-foreground hover:bg-foreground hover:text-background transition-colors touch-target"
    >
      로그아웃
    </button>
  );
}
