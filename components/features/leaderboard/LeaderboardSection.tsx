import { getTeamLeaderboard } from '@/lib/queries/leaderboard';
import { LeaderboardItem } from './LeaderboardItem';

interface LeaderboardSectionProps {
  meetingId: string;
  currentTeamId?: string;
}

export async function LeaderboardSection({
  meetingId,
  currentTeamId,
}: LeaderboardSectionProps) {
  const teams = await getTeamLeaderboard(meetingId);

  if (teams.length === 0) {
    return (
      <div className="card-brutal opacity-60">
        <p className="text-muted-foreground text-sm">
          아직 등록된 조가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 items-start overflow-visible">
      {teams.map((team) => (
        <LeaderboardItem
          key={team.id}
          team={team}
          isMyTeam={team.id === currentTeamId}
        />
      ))}
    </div>
  );
}
