'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants/routes';
import type { DailySubmission } from '@/lib/queries/daily-submissions';

interface DailyMissionStatusProps {
  meetingId: string;
  todaySubmission: DailySubmission | null;
  weeklyCount: number;
  meetingActive: boolean;
  hasTeam: boolean;
}

const STATUS_MAP = {
  pending: { label: '심사 중', className: 'bg-muted text-muted-foreground' },
  approved: { label: '승인', className: 'bg-primary text-primary-foreground' },
  rejected: { label: '반려', className: 'bg-destructive text-destructive-foreground' },
} as const;

export function DailyMissionStatus({
  meetingId,
  todaySubmission,
  weeklyCount,
  meetingActive,
  hasTeam,
}: DailyMissionStatusProps) {
  const [showDetail, setShowDetail] = useState(false);

  // 이번 주 진행 바
  const progressBar = (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((i) => (
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
      <span className="text-sm text-muted-foreground font-mono">{weeklyCount}/3회</span>
    </div>
  );

  if (!meetingActive) {
    return (
      <div className="card-brutal opacity-60">
        <p className="text-sm text-muted-foreground">종료된 모임입니다.</p>
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

  const isWeekComplete = weeklyCount >= 3;

  return (
    <div className="card-brutal space-y-3">
      {progressBar}

      {/* 오늘 제출 상태 */}
      {todaySubmission ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`px-3 py-1.5 text-xs font-bold uppercase border-2 border-border ${STATUS_MAP[todaySubmission.status].className}`}
            >
              오늘 {STATUS_MAP[todaySubmission.status].label}
            </span>
            {todaySubmission.status === 'approved' && (
              <span className="font-mono font-bold text-sm">+1pt</span>
            )}
            <button
              type="button"
              onClick={() => setShowDetail(!showDetail)}
              className="text-xs text-muted-foreground underline underline-offset-2"
            >
              {showDetail ? '닫기' : '제출 상세'}
            </button>
          </div>

          {showDetail && (
            <div className="border-2 border-border p-3 space-y-2 bg-muted">
              {todaySubmission.image_url && (
                <div className="relative w-full aspect-video border-2 border-border overflow-hidden bg-background">
                  <Image
                    src={todaySubmission.image_url}
                    alt="오늘 제출 이미지"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}
              {todaySubmission.completed_at && (
                <p className="text-xs text-muted-foreground">
                  수행일:{' '}
                  {new Date(todaySubmission.completed_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
              {todaySubmission.note && (
                <p className="text-sm border-l-2 border-border pl-3">{todaySubmission.note}</p>
              )}
            </div>
          )}
        </div>
      ) : isWeekComplete ? (
        <p className="text-sm font-bold">이번 주 데일리 미션 완료!</p>
      ) : (
        <Link href={ROUTES.MEETING_DAILY(meetingId)} className="btn-brutal inline-flex">
          오늘 제출하기
        </Link>
      )}

      <p className="text-xs text-muted-foreground">하루 1회 · 주 최대 3회 · 1pt 고정</p>
    </div>
  );
}
