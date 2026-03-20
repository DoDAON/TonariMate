import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (!code) {
    return NextResponse.redirect(`${origin}${ROUTES.LOGIN}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}${ROUTES.LOGIN}`);
  }

  // exchangeCodeForSession 결과에서 user를 바로 사용 (추가 getUser 호출 불필요)
  const user = data.user;

  // users 테이블에 이미 존재하는지 확인
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single();

  if (existingUser) {
    // 기존 유저 → next가 있으면 해당 경로로, 없으면 마이페이지로
    const destination = next ? next : ROUTES.MY;
    return NextResponse.redirect(`${origin}${destination}`);
  }

  // 신규 유저 → 프로필 완성 페이지로 (next가 있으면 signup에도 전달)
  const signupUrl = next
    ? `${ROUTES.SIGNUP}?next=${encodeURIComponent(next)}`
    : ROUTES.SIGNUP;
  return NextResponse.redirect(`${origin}${signupUrl}`);
}
