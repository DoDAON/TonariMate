import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { LogoutButton } from './LogoutButton';

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // users 테이블에서 프로필 가져오기
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // 프로필이 없으면 회원가입으로
  if (!profile) {
    redirect(ROUTES.SIGNUP);
  }

  return (
    <div className="min-h-screen noise-overlay">
      <header className="border-b-2 border-foreground">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={ROUTES.HOME} className="text-xl font-black tracking-tighter uppercase">
            TonariMate
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 프로필 섹션 */}
        <section className="card-brutal mb-8">
          <div className="flex items-center gap-4">
            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-14 h-14 border-2 border-foreground"
              />
            )}
            <div>
              <h2 className="text-xl font-bold">{profile.name}</h2>
              <p className="text-muted-foreground text-sm font-mono">
                {profile.email}
              </p>
              {profile.student_id && (
                <p className="text-muted-foreground text-sm">
                  학번: {profile.student_id}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 내 모임 섹션 */}
        <section>
          <h2 className="text-2xl font-bold uppercase mb-6">내 모임</h2>
          <div className="card-brutal opacity-60">
            <p className="text-muted-foreground text-sm">
              아직 참여한 모임이 없습니다.
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              초대 코드를 받아 모임에 참여해보세요.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
