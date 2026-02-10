import { Logo } from '@/components/shared/Logo';
import { GoogleLoginButton } from '@/components/features/auth/GoogleLoginButton';

export default function LoginPage() {
  return (
    <div className="min-h-screen noise-overlay flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        {/* Logo */}
        <div className="text-center">
          <Logo size="lg" />
          <p className="mt-3 text-muted-foreground text-sm">
            대학 조모임 활동 통합 관리
          </p>
        </div>

        <GoogleLoginButton />

        <p className="text-xs text-muted-foreground font-mono">
          로그인 시 서비스 이용약관에 동의합니다
        </p>
      </div>
    </div>
  );
}
