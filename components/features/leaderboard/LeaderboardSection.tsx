import { getTeamLeaderboard } from '@/lib/queries/leaderboard';

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
    <div className="grid grid-cols-2 gap-3">
      {teams.map((team) => {
        const isMyTeam = team.id === currentTeamId;

        const defaultName = `${team.team_number}조`;
        const hasCustomName = team.name !== defaultName;

        return (
          <div
            key={team.id}
            className={`card-brutal ${isMyTeam ? 'border-primary border-[3px]' : ''}`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold">{defaultName}</span>
              {isMyTeam && (
                <span className="text-xs font-bold bg-primary text-primary-foreground px-1.5 py-0.5 border border-foreground">
                  MY
                </span>
              )}
            </div>
            {hasCustomName && (
              <p className="text-sm text-muted-foreground truncate">{team.name}</p>
            )}
            <p className="text-xs text-muted-foreground">{team.member_count}명</p>
          </div>
        );
      })}
    </div>
  );
}
