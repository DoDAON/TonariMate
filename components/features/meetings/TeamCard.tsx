import Image from 'next/image';
import { formatTeamName } from '@/lib/utils';
import type { UserTeam } from '@/lib/queries/teams';

interface TeamCardProps {
  team: UserTeam;
}

export function TeamCard({ team }: TeamCardProps) {
  return (
    <div className="card-brutal transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:[box-shadow:var(--shadow-brutal-lg)] active:translate-x-[2px] active:translate-y-[2px] active:[box-shadow:var(--shadow-brutal-sm)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">
          {formatTeamName(team.team_number, team.name)}
        </h3>
        <span className="font-mono font-bold">{team.total_points}pt</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {team.members.map((member) => (
          <div key={member.id} className="flex items-center gap-2">
            {member.avatar_url ? (
              <Image
                src={member.avatar_url}
                alt={member.name}
                width={32}
                height={32}
                className="border-2 border-foreground"
              />
            ) : (
              <div className="w-8 h-8 border-2 border-foreground bg-muted flex items-center justify-center text-xs font-bold">
                {member.name.charAt(0)}
              </div>
            )}
            <span className="text-sm font-medium">{member.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
