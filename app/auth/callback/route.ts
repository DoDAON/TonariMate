import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}${ROUTES.LOGIN}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}${ROUTES.LOGIN}`);
  }

  // 세션에서 유저 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}${ROUTES.LOGIN}`);
  }

  // users 테이블에 이미 존재하는지 확인
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single();

  if (existingUser) {
    // 기존 유저 → 마이페이지로
    return NextResponse.redirect(`${origin}${ROUTES.MY}`);
  }

  // 신규 유저 → 프로필 완성 페이지로
  return NextResponse.redirect(`${origin}${ROUTES.SIGNUP}`);
}
