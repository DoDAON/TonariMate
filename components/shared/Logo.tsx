import Link from 'next/link';
import { ROUTES } from '@/lib/constants/routes';

interface LogoProps {
  size?: 'sm' | 'lg';
  href?: string;
}

export function Logo({ size = 'lg', href }: LogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    lg: 'text-5xl md:text-7xl',
  };

  const content =
    size === 'sm' ? (
      <span className={`${sizeClasses.sm} font-black tracking-tighter uppercase`}>
        TonariMate
      </span>
    ) : (
      <h1 className={`${sizeClasses.lg} font-black tracking-tighter uppercase`}>
        Tonari
        <span className="block text-muted-foreground">Mate</span>
      </h1>
    );

  if (href) {
    return (
      <Link href={href} className={`${sizeClasses[size]} font-black tracking-tighter uppercase`}>
        TonariMate
      </Link>
    );
  }

  return content;
}
