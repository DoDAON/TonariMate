'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { LeaderboardTeam } from '@/lib/queries/leaderboard';

interface LeaderboardItemProps {
  team: LeaderboardTeam;
  isMyTeam: boolean;
}

export function LeaderboardItem({ team, isMyTeam }: LeaderboardItemProps) {
  const [open, setOpen] = useState(false);

  const defaultName = `${team.team_number}조`;
  const hasCustomName = team.name !== defaultName;

  return (
    <div
      className={`card-brutal cursor-pointer select-none ${isMyTeam ? 'border-primary border-[3px]' : ''}`}
      onClick={() => setOpen((prev) => !prev)}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold">{defaultName}</span>
            {isMyTeam && (
              <span className="text-xs font-bold bg-primary text-primary-foreground px-1.5 py-0.5 border border-foreground">
                MY
              </span>
            )}
          </div>
          <p className={`text-sm text-muted-foreground ${open ? 'break-words' : 'truncate'} ${!hasCustomName ? 'invisible' : ''}`}>
            {hasCustomName ? team.name : defaultName}
          </p>
          <p className="text-xs text-muted-foreground">{team.member_count}명</p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
          {open ? '▲' : '▼'}
        </span>
      </div>

      {/* 아코디언 멤버 리스트 */}
      {open && (
        <ul className="mt-3 pt-3 border-t-2 border-border space-y-2">
          {team.members.length === 0 ? (
            <li className="text-xs text-muted-foreground">멤버 없음</li>
          ) : (
            team.members.map((m, i) => (
              <li key={i} className="flex items-center gap-2">
                <div className="relative w-6 h-6 shrink-0 overflow-hidden rounded-full border border-border">
                  {m.avatar_url ? (
                    <Image
                      src={m.avatar_url}
                      alt={m.name}
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] font-bold">
                      {m.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-sm font-bold truncate">{m.name}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
