'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/constants/routes';
import { deleteMission } from '@/lib/actions/admin-missions';
import { getEffectiveMissionStatus } from '@/lib/utils';

interface Mission {
  id: string;
  title: string;
  points: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed';
}

interface AdminMissionListProps {
  missions: Mission[];
  meetingId: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}


export function AdminMissionList({ missions, meetingId }: AdminMissionListProps) {
  async function handleDelete(missionId: string, title: string) {
    if (!confirm(`"${title}" 미션을 삭제하시겠습니까?`)) return;
    const result = await deleteMission(missionId, meetingId);
    if (!result.success) alert(result.error);
  }

  return (
    <div className="grid gap-3">
      {missions.map((mission) => {
        const effectiveStatus = getEffectiveMissionStatus(mission.status, mission.end_date);
        return (
          <div key={mission.id} className="card-brutal flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2 py-0.5 text-xs font-bold uppercase border-2 border-border ${
                    effectiveStatus === 'active'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {effectiveStatus === 'active' ? '진행 중' : '종료'}
                </span>
                <span className="font-mono text-sm">{mission.points}pt</span>
              </div>
              <h3 className="font-black text-lg">{mission.title}</h3>
              <p className="text-sm text-muted-foreground font-mono">
                {formatDate(mission.start_date)} ~ {formatDate(mission.end_date)}
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <Link
                href={ROUTES.ADMIN_MEETING_MISSION(meetingId, mission.id)}
                className="btn-brutal bg-muted text-foreground text-sm"
              >
                상세
              </Link>
              <Link
                href={ROUTES.ADMIN_MEETING_MISSION_EDIT(meetingId, mission.id)}
                className="btn-brutal bg-muted text-foreground text-sm"
              >
                수정
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(mission.id, mission.title)}
                className="btn-brutal bg-destructive text-destructive-foreground text-sm"
              >
                삭제
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
