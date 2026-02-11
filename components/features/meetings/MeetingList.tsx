import { MeetingCard } from './MeetingCard';
import { EmptyState } from '@/components/shared/EmptyState';
import type { UserMeeting } from '@/lib/queries/meetings';

interface MeetingListProps {
  meetings: UserMeeting[];
}

export function MeetingList({ meetings }: MeetingListProps) {
  if (meetings.length === 0) {
    return (
      <EmptyState
        message="아직 참여한 모임이 없습니다."
        description="초대 코드를 받아 모임에 참여해보세요."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {meetings.map((meeting) => (
        <MeetingCard key={meeting.id} meeting={meeting} />
      ))}
    </div>
  );
}
