'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/constants/routes';

interface GoogleLoginButtonProps {
  nextUrl?: string;
}

function detectInAppBrowser() {
  if (typeof navigator === 'undefined') return { inApp: false, isIos: false };
  const ua = navigator.userAgent;
  const inApp =
    /KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER|Snapchat/i.test(ua) ||
    (/Android/i.test(ua) && /wv\b/.test(ua));
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  return { inApp, isIos };
}

export function GoogleLoginButton({ nextUrl }: GoogleLoginButtonProps = {}) {
  // null = 아직 감지 전, false = 일반 브라우저, true = 인앱(iOS)
  const [iosInApp, setIosInApp] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const { inApp, isIos } = detectInAppBrowser();
    if (!inApp) {
      setIosInApp(false);
      return;
    }

    if (isIos) {
      // iOS: 자동 전환 불가 → 안내 UI 표시
      setIosInApp(true);
    } else {
      // Android: intent:// 스킴으로 외부 브라우저(Chrome) 자동 전환
      const current = window.location.href;
      const intentUrl =
        current.replace(/^https?:\/\//, 'intent://') +
        '#Intent;scheme=https;package=com.android.chrome;end;';
      window.location.href = intentUrl;
      // 전환 실패 시 fallback으로 안내 UI 표시
      setTimeout(() => setIosInApp(true), 1500);
    }
  }, []);

  const handleGoogleLogin = async () => {
    if (nextUrl) {
      // OAuth redirectTo URL에 쿼리 파라미터를 붙이면 Supabase 허용 URL 검증에 걸림
      // 쿠키에 저장 후 콜백에서 읽는 방식으로 우회
      document.cookie = `auth_next=${encodeURIComponent(nextUrl)};path=/;max-age=300;samesite=lax`;
    }
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${ROUTES.CALLBACK}`,
        queryParams: { prompt: 'select_account' },
      },
    });
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 감지 전 또는 Android 자동 전환 중
  if (iosInApp === null) return null;

  // iOS 인앱 브라우저 → 안내 UI
  if (iosInApp) {
    return (
      <div className="card-brutal w-full space-y-4 text-center">
        <p className="font-bold text-sm">인앱 브라우저에서는 Google 로그인이 지원되지 않습니다</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          우측 하단 <span className="font-bold text-foreground">공유 버튼 → Safari로 열기</span>를
          선택하거나, 링크를 복사해 Safari / Chrome에서 직접 열어주세요.
        </p>
        <button
          type="button"
          onClick={handleCopyUrl}
          className="btn-brutal w-full bg-muted text-foreground"
        >
          {copied ? '복사됨!' : '링크 복사하기'}
        </button>
      </div>
    );
  }

  return (
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
  );
}
