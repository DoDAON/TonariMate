'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface Team {
  id: string;
  team_number: number;
  name: string;
}

interface TeamInviteLinksProps {
  teams: Team[];
  inviteCode: string;
}

export function TeamInviteLinks({ teams, inviteCode }: TeamInviteLinksProps) {
  const [copiedTeam, setCopiedTeam] = useState<number | null>(null);

  if (teams.length === 0) {
    return (
      <p className="text-sm text-muted-foreground font-mono">
        조를 먼저 설정해주세요
      </p>
    );
  }

  async function handleCopy(teamNumber: number) {
    const url = `${window.location.origin}/join?code=${inviteCode}&team=${teamNumber}`;
    await navigator.clipboard.writeText(url);
    setCopiedTeam(teamNumber);
    toast.success(`${teamNumber}조 초대 링크 복사됨`);
    setTimeout(() => setCopiedTeam(null), 2000);
  }

  return (
    <div className="flex flex-col gap-2">
      {teams.map((team) => {
        const url = `…/join?code=${inviteCode}&team=${team.team_number}`;
        return (
          <div key={team.id} className="flex items-center gap-3">
            <span className="font-mono font-bold w-8 shrink-0">{team.team_number}조</span>
            <code className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 border border-border flex-1 truncate">
              {url}
            </code>
            <button
              type="button"
              onClick={() => handleCopy(team.team_number)}
              className="btn-brutal bg-muted text-foreground text-xs shrink-0"
            >
              {copiedTeam === team.team_number ? '복사됨!' : '복사'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
