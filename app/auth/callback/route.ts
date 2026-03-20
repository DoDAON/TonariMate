import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}${ROUTES.LOGIN}`);
  }

  // next URL은 OAuth redirectTo 대신 쿠키로 전달 (Supabase 허용 URL 검증 우회)
  const rawNext = request.headers.get('cookie')
    ?.split(';')
    .find((c) => c.trim().startsWith('auth_next='))
    ?.split('=')[1];
  const next = rawNext ? decodeURIComponent(rawNext) : null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    const res = NextResponse.redirect(`${origin}${ROUTES.LOGIN}`);
    res.cookies.delete('auth_next');
    return res;
  }

  // exchangeCodeForSession 결과에서 user를 바로 사용 (추가 getUser 호출 불필요)
  const user = data.user;

  // users 테이블에 이미 존재하는지 확인
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single();

  const clearCookie = (res: NextResponse) => {
    res.cookies.delete('auth_next');
    return res;
  };

  if (existingUser) {
    const destination = next ?? ROUTES.MY;
    return clearCookie(NextResponse.redirect(`${origin}${destination}`));
  }

  // 신규 유저 → 프로필 완성 페이지로 (next가 있으면 signup에도 전달)
  const signupUrl = next
    ? `${ROUTES.SIGNUP}?next=${encodeURIComponent(next)}`
    : ROUTES.SIGNUP;
  return clearCookie(NextResponse.redirect(`${origin}${signupUrl}`));
}
