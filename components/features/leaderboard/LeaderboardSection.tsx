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
    <div className="space-y-3">
      {teams.map((team) => {
        const isMyTeam = team.id === currentTeamId;

        return (
          <div
            key={team.id}
            className={`card-brutal flex items-center gap-4 ${
              isMyTeam ? 'border-primary border-[3px]' : ''
            }`}
          >
            {/* 팀 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold truncate">{team.name}</span>
                {isMyTeam && (
                  <span className="text-xs font-bold bg-primary text-primary-foreground px-1.5 py-0.5 border border-foreground">
                    MY
                  </span>
                )}
              </div>
              <span className="text-muted-foreground text-xs">
                {team.member_count}명
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
