import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { ROUTES } from '@/lib/constants/routes';

// 인증 없이 접근 가능한 경로
const PUBLIC_PATHS = [ROUTES.HOME, ROUTES.LOGIN, ROUTES.CALLBACK, ROUTES.JOIN];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith('/auth/')
  );

  // 미인증 유저가 보호된 경로에 접근 시 → 로그인으로
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.LOGIN;
    return NextResponse.redirect(url);
  }

  // 인증된 유저가 로그인 페이지에 접근 시 → 마이페이지로
  if (user && pathname === ROUTES.LOGIN) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.MY;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
