import Link from 'next/link';
import { ROUTES } from '@/lib/constants/routes';

export default function MissionNotFound() {
  return (
    <div className="min-h-screen noise-overlay flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-5xl font-black tracking-tighter uppercase mb-4">404</h1>
        <p className="text-muted-foreground mb-8">
          미션을 찾을 수 없거나 접근 권한이 없습니다.
        </p>
        <Link href={ROUTES.MY} className="btn-brutal touch-target">
          마이페이지로
        </Link>
      </div>
    </div>
  );
}
