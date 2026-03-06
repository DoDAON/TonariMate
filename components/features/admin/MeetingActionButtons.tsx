'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/constants/routes';
import { endMeeting, deleteMeeting } from '@/lib/actions/admin-meetings';

interface MeetingActionButtonsProps {
  meetingId: string;
  meetingName: string;
  isActive: boolean;
}

export function MeetingActionButtons({ meetingId, meetingName, isActive }: MeetingActionButtonsProps) {
  const router = useRouter();
  const [modal, setModal] = useState<'end' | 'delete' | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEnd() {
    setLoading(true);
    const result = await endMeeting(meetingId);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? '모임 종료에 실패했습니다');
    } else {
      toast.success('모임이 종료되었습니다');
      setModal(null);
      router.refresh();
    }
  }

  async function handleDelete() {
    setLoading(true);
    const result = await deleteMeeting(meetingId);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? '모임 삭제에 실패했습니다');
    } else {
      toast.success('모임이 삭제되었습니다');
      setModal(null);
      router.push(ROUTES.ADMIN);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        {isActive && (
          <button
            type="button"
            onClick={() => setModal('end')}
            className="btn-brutal bg-muted text-foreground text-sm"
          >
            모임 종료
          </button>
        )}
        <button
          type="button"
          onClick={() => setModal('delete')}
          className="btn-brutal bg-destructive text-destructive-foreground text-sm"
        >
          모임 삭제
        </button>
      </div>

      {/* 모임 종료 모달 */}
      {modal === 'end' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="card-brutal w-full max-w-sm">
            <h3 className="text-lg font-black uppercase mb-4">모임 종료</h3>
            <div className="card-brutal bg-muted mb-4">
              <p className="text-sm font-bold">{meetingName}</p>
              <p className="text-sm mt-2">
                모임을 종료하면 일반 유저의 미션 제출이 불가해집니다.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                * 종료 후 되돌릴 수 없습니다.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleEnd}
                disabled={loading}
                className="btn-brutal flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? '처리 중...' : '종료 확인'}
              </button>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="btn-brutal flex-1 bg-muted text-foreground"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모임 삭제 모달 */}
      {modal === 'delete' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="card-brutal w-full max-w-sm">
            <div className="text-center mb-4">
              <p className="text-2xl mb-2">⚠️</p>
              <h3 className="text-lg font-black uppercase">모임 삭제 확인</h3>
            </div>
            <div className="card-brutal bg-destructive/10 border-destructive mb-4">
              <p className="text-sm font-bold text-destructive">이 작업은 되돌릴 수 없습니다.</p>
              <p className="text-sm mt-1">
                <span className="font-bold">{meetingName}</span> 모임을 삭제하면
                모든 조, 미션, 제출 내역, 포인트가 함께 삭제됩니다.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="btn-brutal flex-1 bg-destructive text-destructive-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? '삭제 중...' : '삭제 확인'}
              </button>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="btn-brutal flex-1 bg-muted text-foreground"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
