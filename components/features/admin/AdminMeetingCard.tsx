import Link from 'next/link';
import { ROUTES } from '@/lib/constants/routes';
import type { AdminMeetingSummary } from '@/lib/queries/admin';

interface AdminMeetingCardProps {
  meeting: AdminMeetingSummary;
}

export function AdminMeetingCard({ meeting }: AdminMeetingCardProps) {
  return (
    <Link href={ROUTES.ADMIN_MEETING(meeting.id)}>
      <div className="card-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black text-lg uppercase tracking-tight">
            {meeting.name}
          </h3>
          <span
            className={`px-2 py-0.5 text-xs font-bold uppercase border-2 border-border ${
              meeting.is_active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {meeting.is_active ? '활성' : '비활성'}
          </span>
        </div>

        <p className="text-sm text-muted-foreground mb-3 font-mono">
          {meeting.period}
        </p>

        <div className="flex gap-4 text-sm font-mono">
          <span>{meeting.member_count}명</span>
          <span>{meeting.team_count}팀</span>
          <span>{meeting.mission_count}미션</span>
        </div>
      </div>
    </Link>
  );
}
