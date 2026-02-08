'use client';

import { createClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/constants/routes';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${ROUTES.CALLBACK}`,
      },
    });
  };

  return (
    <div className="min-h-screen noise-overlay flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tighter uppercase">
            Tonari
            <span className="block text-muted-foreground">Mate</span>
          </h1>
          <p className="mt-3 text-muted-foreground text-sm">
            대학 조모임 활동 통합 관리
          </p>
        </div>

        {/* Login Button */}
        <button
          onClick={handleGoogleLogin}
          className="btn-brutal touch-target w-full flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 시작하기
        </button>

        {/* Footer */}
        <p className="text-xs text-muted-foreground font-mono">
          로그인 시 서비스 이용약관에 동의합니다
        </p>
      </div>
    </div>
  );
}
