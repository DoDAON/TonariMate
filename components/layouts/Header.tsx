import { Logo } from '@/components/shared/Logo';
import { ROUTES } from '@/lib/constants/routes';

interface HeaderProps {
  actions?: React.ReactNode;
}

export function Header({ actions }: HeaderProps) {
  return (
    <header className="border-b-2 border-foreground">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Logo size="sm" href={ROUTES.HOME} />
        {actions}
      </div>
    </header>
  );
}
