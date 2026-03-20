import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { joinMeetingWithTeam } from '@/lib/actions/meetings';
import { Logo } from '@/components/shared/Logo';
import { GoogleLoginButton } from '@/components/features/auth/GoogleLoginButton';

interface JoinPageProps {
  searchParams: Promise<{ code?: string; team?: string }>;
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const { code, team } = await searchParams;

  if (!code) {
    redirect(ROUTES.MY);
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 비로그인 → 로그인 유도 (현재 URL을 next로 보존)
  if (!session) {
    const currentPath = `/join?code=${code}${team ? `&team=${team}` : ''}`;
    return (
      <div className="min-h-screen noise-overlay flex items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col items-center gap-10">
          <div className="text-center">
            <Logo size="lg" />
            <p className="mt-3 text-muted-foreground text-sm">
              모임에 참여하려면 로그인이 필요합니다
            </p>
          </div>

          <div className="card-brutal w-full text-center p-6">
            <p className="font-mono text-sm text-muted-foreground mb-1">초대 코드</p>
            <p className="font-black text-2xl tracking-widest mb-4">{code.toUpperCase()}</p>
            {team && (
              <p className="text-sm text-muted-foreground mb-4">
                로그인 후 <span className="font-bold">{team}조</span>에 자동 배정됩니다
              </p>
            )}
          </div>

          <GoogleLoginButton nextUrl={currentPath} />
        </div>
      </div>
    );
  }

  // 로그인 상태 → 모임 참여 처리
  const teamNumber = team ? parseInt(team, 10) : null;
  const validTeamNumber = teamNumber !== null && !isNaN(teamNumber) ? teamNumber : null;

  const result = await joinMeetingWithTeam(session.user.id, code, validTeamNumber);

  if (!result.success) {
    return (
      <div className="min-h-screen noise-overlay flex items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          <Logo size="lg" />
          <div className="card-brutal w-full text-center p-6">
            <p className="font-black text-lg mb-2">참여 실패</p>
            <p className="text-sm text-muted-foreground">{result.error}</p>
          </div>
          <a href={ROUTES.MY} className="btn-brutal w-full text-center">
            마이페이지로 이동
          </a>
        </div>
      </div>
    );
  }

  redirect(ROUTES.MEETING(result.meetingId!));
}
