import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Logo } from '@/components/shared/Logo';
import { Footer } from '@/components/layouts/Footer';
import { EmptyState } from '@/components/shared/EmptyState';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen noise-overlay">
      <main className="container mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-8 mb-16">
          <Logo size="lg" />
          <p className="text-lg md:text-xl text-muted-foreground max-w-md">
            대학 조모임 활동 통합 관리
          </p>
          <Link href={user ? ROUTES.MY : ROUTES.LOGIN} className="btn-brutal touch-target">
            시작하기
          </Link>
        </section>

        {/* Features Preview */}
        <section className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto mb-16">
          <div className="card-brutal">
            <h3 className="text-lg font-bold uppercase mb-2">미션</h3>
            <p className="text-muted-foreground text-sm">
              주간 미션을 확인하고 수행 사진을 제출하세요
            </p>
          </div>
          <div className="card-brutal">
            <h3 className="text-lg font-bold uppercase mb-2">포인트</h3>
            <p className="text-muted-foreground text-sm">
              미션 완료 시 포인트를 획득하고 순위를 확인하세요
            </p>
          </div>
          <div className="card-brutal">
            <h3 className="text-lg font-bold uppercase mb-2">조 관리</h3>
            <p className="text-muted-foreground text-sm">
              조원들과 함께 미션을 수행하고 기록을 관리하세요
            </p>
          </div>
        </section>

        {/* 내 모임 섹션 */}
        <section className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold uppercase mb-6">내 모임</h2>
          {user ? (
            <EmptyState
              message="아직 참여한 모임이 없습니다."
              description="초대 코드를 받아 모임에 참여해보세요."
            />
          ) : (
            <EmptyState message="로그인 후 모임을 확인할 수 있습니다." />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
