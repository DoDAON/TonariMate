import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { Header } from '@/components/layouts/Header';
import { LogoutButton } from '@/components/features/auth/LogoutButton';
import { ProfileSection } from '@/components/features/auth/ProfileSection';
import { EmptyState } from '@/components/shared/EmptyState';
import { JoinMeetingForm } from '@/components/features/meetings/JoinMeetingForm';

export default async function MyPage() {
  const supabase = await createClient();
  // 미들웨어에서 getUser()로 이미 검증 완료 → getSession()은 로컬 쿠키에서 읽어 네트워크 호출 없음
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect(ROUTES.LOGIN);
  }

  const user = session.user;

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
      <Header actions={<LogoutButton />} />

      <main className="container mx-auto px-4 py-8">
        {/* 프로필 섹션 */}
        <div className="mb-8">
          <ProfileSection
            userId={profile.id}
            name={profile.name}
            email={profile.email}
            avatarUrl={profile.avatar_url}
            studentId={profile.student_id}
          />
        </div>

        {/* 내 모임 섹션 */}
        <section>
          <h2 className="text-2xl font-bold uppercase mb-6">내 모임</h2>
          <JoinMeetingForm userId={profile.id} />
          <EmptyState
            message="아직 참여한 모임이 없습니다."
            description="초대 코드를 받아 모임에 참여해보세요."
          />
        </section>
      </main>
    </div>
  );
}
