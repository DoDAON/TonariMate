import Link from 'next/link';
import { ROUTES } from '@/lib/constants/routes';
import type { MeetingDetail } from '@/lib/queries/meetings';

interface MeetingInfoProps {
  meeting: MeetingDetail;
  meetingId: string;
}

export function MeetingInfo({ meeting, meetingId }: MeetingInfoProps) {
  return (
    <section className="card-brutal">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-black tracking-tight">{meeting.name}</h1>
          <p className="text-muted-foreground font-mono mt-2">{meeting.period}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs font-bold uppercase border-2 border-foreground px-2 py-1">
            {meeting.memberRole === 'admin' ? '관리자' : '멤버'}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {meeting.memberCount}명
          </span>
        </div>
      </div>
      {meeting.description && (
        <p className="text-foreground mt-4">{meeting.description}</p>
      )}
      {!meeting.is_active && (
        <p className="text-muted-foreground text-sm font-mono uppercase mt-4 border-t-2 border-foreground pt-4">
          이 모임은 종료되었습니다
          {meeting.end_date && (
            <span className="ml-2 normal-case">
              ({new Date(meeting.end_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })})
            </span>
          )}
        </p>
      )}
      <div className="mt-4 pt-4 border-t-2 border-foreground">
        <Link
          href={ROUTES.MEETING_ANNOUNCEMENTS(meetingId)}
          className="inline-flex items-center gap-2 text-sm font-bold uppercase border-2 border-foreground px-4 py-2 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:[box-shadow:2px_2px_0_var(--foreground)] active:translate-x-[1px] active:translate-y-[1px] active:[box-shadow:none] transition-all duration-100"
        >
          공지사항 보기
        </Link>
      </div>
    </section>
  );
}
