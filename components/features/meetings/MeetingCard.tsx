import Link from 'next/link';
import { ROUTES } from '@/lib/constants/routes';
import type { UserMeeting } from '@/lib/queries/meetings';

interface MeetingCardProps {
  meeting: UserMeeting;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  return (
    <Link href={ROUTES.MEETING(meeting.id)} className="block">
      <div className="card-brutal transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:[box-shadow:var(--shadow-brutal-lg)] active:translate-x-[2px] active:translate-y-[2px] active:[box-shadow:var(--shadow-brutal-sm)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold truncate">{meeting.name}</h3>
            <p className="text-muted-foreground text-sm font-mono mt-1">
              {meeting.period}
            </p>
            {meeting.description && (
              <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                {meeting.description}
              </p>
            )}
          </div>
          <span className="text-xs font-bold uppercase border-2 border-foreground px-2 py-1 shrink-0">
            {meeting.role === 'admin' ? '관리자' : '멤버'}
          </span>
        </div>
      </div>
    </Link>
  );
}
