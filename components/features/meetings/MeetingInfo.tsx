import type { MeetingDetail } from '@/lib/queries/meetings';

interface MeetingInfoProps {
  meeting: MeetingDetail;
}

export function MeetingInfo({ meeting }: MeetingInfoProps) {
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
        </p>
      )}
    </section>
  );
}
