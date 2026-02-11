import Link from 'next/link';
import { ROUTES } from '@/lib/constants/routes';
import { EmptyState } from '@/components/shared/EmptyState';
import type { CategorizedMissions, MissionSummary } from '@/lib/queries/missions';

interface MissionSectionProps {
  missions: CategorizedMissions;
  meetingId: string;
}

export function MissionSection({ missions, meetingId }: MissionSectionProps) {
  const totalCount =
    missions.active.length + missions.upcoming.length + missions.completed.length;

  if (totalCount === 0) {
    return (
      <EmptyState
        message="등록된 미션이 없습니다."
        description="관리자가 미션을 등록하면 여기에 표시됩니다."
      />
    );
  }

  return (
    <div className="space-y-6">
      {missions.active.length > 0 && (
        <MissionGroup
          title="진행 중"
          missions={missions.active}
          meetingId={meetingId}
        />
      )}
      {missions.upcoming.length > 0 && (
        <MissionGroup
          title="예정"
          missions={missions.upcoming}
          meetingId={meetingId}
        />
      )}
      {missions.completed.length > 0 && (
        <MissionGroup
          title="완료"
          missions={missions.completed}
          meetingId={meetingId}
        />
      )}
    </div>
  );
}

interface MissionGroupProps {
  title: string;
  missions: MissionSummary[];
  meetingId: string;
}

function MissionGroup({ title, missions, meetingId }: MissionGroupProps) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3">
        {title} ({missions.length})
      </h3>
      <div className="grid gap-3">
        {missions.map((mission) => (
          <MissionItem
            key={mission.id}
            mission={mission}
            meetingId={meetingId}
          />
        ))}
      </div>
    </div>
  );
}

interface MissionItemProps {
  mission: MissionSummary;
  meetingId: string;
}

function MissionItem({ mission, meetingId }: MissionItemProps) {
  return (
    <Link href={ROUTES.MISSION(meetingId, mission.id)} className="block">
      <div className="card-brutal transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:[box-shadow:var(--shadow-brutal-lg)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold truncate">{mission.title}</h4>
            <p className="text-muted-foreground text-sm mt-1 line-clamp-1">
              {mission.description}
            </p>
          </div>
          <span className="font-mono font-bold whitespace-nowrap shrink-0">
            {mission.points}pt
          </span>
        </div>
        <p className="text-muted-foreground text-xs font-mono mt-2">
          {mission.start_date} ~ {mission.end_date}
        </p>
      </div>
    </Link>
  );
}
