'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants/routes';
import type { DailySubmission } from '@/lib/queries/daily-submissions';

interface DailyMissionStatusProps {
  meetingId: string;
  todaySubmission: DailySubmission | null;
  weeklyCount: number;
  meetingActive: boolean;
  hasTeam: boolean;
  startDate?: string | null;
}

const STATUS_MAP = {
  pending: { label: '심사 중', className: 'bg-muted text-muted-foreground' },
  approved: { label: '승인', className: 'bg-primary text-primary-foreground' },
  rejected: { label: '반려', className: 'bg-destructive text-destructive-foreground' },
} as const;

function DailyInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="card-brutal bg-background max-w-sm w-full mx-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-black uppercase">데일리 미션이란?</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground font-bold">
            ✕
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <p>조원과 함께 활동을 하고 인증하기</p>
          <p className="text-muted-foreground">(예: 카페가기, 식사하기, 게임하기, 공부하기 등 함께라면 무엇이든!)</p>
          <ul className="space-y-1">
            <li>■ 데일리 미션은 수행 당 1점이 부여됩니다</li>
            <li>■ 4인 이상 참여 시 데일리 미션 포인트를 획득할 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function DailyMissionStatus({
  meetingId,
  todaySubmission,
  weeklyCount,
  meetingActive,
  hasTeam,
  startDate,
}: DailyMissionStatusProps) {
  const [showInfo, setShowInfo] = useState(false);

  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
  const notStarted = !!startDate && today < startDate;

  // 이번 주 진행 바
  const progressBar = (
    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-8 h-8 border-2 border-foreground flex items-center justify-center text-xs font-bold ${
                i <= weeklyCount ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {i}
            </div>
          ))}
        </div>
        <span className="text-sm text-muted-foreground font-mono">{weeklyCount}/5회</span>
      </div>
      <button
        type="button"
        onClick={() => setShowInfo(true)}
        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        데일리 미션이란 ?
      </button>
    </div>
  );

  if (!meetingActive) {
    return (
      <div className="card-brutal opacity-60">
        <p className="text-sm text-muted-foreground">종료된 모임입니다.</p>
      </div>
    );
  }

  if (notStarted) {
    return (
      <div className="card-brutal opacity-60">
        <p className="text-sm text-muted-foreground">
          데일리 미션은 <span className="font-bold text-foreground">{startDate}</span> 부터 시작됩니다.
        </p>
      </div>
    );
  }

  if (!hasTeam) {
    return (
      <div className="card-brutal opacity-60">
        <p className="text-sm text-muted-foreground">팀 배정 후 참여할 수 있습니다.</p>
      </div>
    );
  }

  const isWeekComplete = weeklyCount >= 5;

  return (
    <div className="card-brutal space-y-3">
      {showInfo && <DailyInfoModal onClose={() => setShowInfo(false)} />}
      {progressBar}

      {/* 오늘 제출 상태 */}
      {todaySubmission ? (
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`px-3 py-1.5 text-xs font-bold uppercase border-2 border-border ${STATUS_MAP[todaySubmission.status].className}`}
          >
            오늘 {STATUS_MAP[todaySubmission.status].label}
          </span>
          {todaySubmission.status === 'approved' && (
            <span className="font-mono font-bold text-sm">+1pt</span>
          )}
        </div>
      ) : isWeekComplete ? (
        <p className="text-sm font-bold">이번 주 데일리 미션 완료!</p>
      ) : (
        <Link href={ROUTES.MEETING_DAILY(meetingId)} className="btn-brutal inline-flex">
          오늘 제출하기
        </Link>
      )}

      <p className="text-xs text-muted-foreground">하루 1회 · 주 최대 5회 · 3pt 고정</p>
    </div>
  );
}
