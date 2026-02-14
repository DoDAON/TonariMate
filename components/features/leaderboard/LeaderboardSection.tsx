import Link from 'next/link';
import { ROUTES } from '@/lib/constants/routes';
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
      {teams.map((team, index) => {
        const rank = index + 1;
        const isMyTeam = team.id === currentTeamId;

        return (
          <Link
            key={team.id}
            href={ROUTES.TEAM(meetingId, team.id)}
            className="block"
          >
            <div
              className={`card-brutal flex items-center gap-4 transition-transform hover:-translate-y-0.5 ${
                isMyTeam ? 'border-primary border-[3px]' : ''
              }`}
            >
              {/* 순위 */}
              <div className="flex-shrink-0 w-10 h-10 border-2 border-foreground bg-muted flex items-center justify-center font-mono font-bold text-lg">
                {rank}
              </div>

              {/* 팀 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold truncate">{team.name}</span>
                  <span className="text-muted-foreground font-mono text-sm">
                    #{team.team_number}
                  </span>
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

              {/* 포인트 */}
              <div className="flex-shrink-0 font-mono font-bold text-lg">
                {team.total_points}
                <span className="text-sm text-muted-foreground">pt</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
