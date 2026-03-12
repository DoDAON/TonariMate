import Link from 'next/link';

interface WeekSelectorProps {
  weeks: string[];
  selectedWeek: string;
  currentWeekStart: string;
  baseUrl: string;
  /** searchParam 키 이름 (기본값: 'week') */
  paramKey?: string;
}

export function WeekSelector({
  weeks,
  selectedWeek,
  currentWeekStart,
  baseUrl,
  paramKey = 'week',
}: WeekSelectorProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {weeks.map((w) => (
        <Link
          key={w}
          href={`${baseUrl}?${paramKey}=${w}`}
          className={`px-3 py-1.5 text-sm font-bold border-2 border-foreground transition-all duration-100 ${
            w === selectedWeek
              ? 'bg-foreground text-background'
              : 'bg-muted text-foreground hover:translate-x-[-1px] hover:translate-y-[-1px]'
          }`}
        >
          {w === currentWeekStart ? '이번 주' : w}
        </Link>
      ))}
    </div>
  );
}
