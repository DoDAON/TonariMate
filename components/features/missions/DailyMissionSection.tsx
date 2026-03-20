'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { uploadDailyImage } from '@/lib/storage/upload';
import { submitDailyMission } from '@/lib/actions/daily-submissions';
import type { DailySubmission } from '@/lib/queries/daily-submissions';
import { ImageWithLightbox } from '@/components/features/missions/ImageWithLightbox';

interface DailyMissionSectionProps {
  meetingId: string;
  teamId: string;
  userId: string;
  todaySubmission: DailySubmission | null;
  weeklyCount: number; // rejected 제외 이번 주 제출 횟수
}

const STATUS_MAP = {
  pending: { label: '심사 중', className: 'bg-muted text-muted-foreground' },
  approved: { label: '승인', className: 'bg-primary text-primary-foreground' },
  rejected: { label: '반려', className: 'bg-destructive text-destructive-foreground' },
} as const;

export default function DailyMissionSection({
  meetingId,
  teamId,
  userId,
  todaySubmission,
  weeklyCount,
}: DailyMissionSectionProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [completedAt, setCompletedAt] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isWeekComplete = weeklyCount >= 3;
  const canSubmitToday = !todaySubmission && !isWeekComplete;

  const noteLen = note.trim().length;
  const noteInvalid = noteLen > 0 && noteLen < 5;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleSubmit() {
    if (!file) {
      toast.error('이미지를 선택해주세요');
      return;
    }
    if (!completedAt) {
      toast.error('수행 날짜를 입력해주세요');
      return;
    }
    if (noteInvalid) {
      toast.error('메모는 5자 이상 입력하거나 비워두세요');
      return;
    }

    setLoading(true);

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const uploadResult = await uploadDailyImage(file, meetingId, userId, dateStr);
    if (!uploadResult.success || !uploadResult.url) {
      toast.error(uploadResult.error ?? '업로드 실패');
      setLoading(false);
      return;
    }

    const result = await submitDailyMission(
      meetingId,
      teamId,
      userId,
      uploadResult.url,
      completedAt,
      note || undefined
    );

    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? '제출 실패');
    }
    // 성공 시 서버 revalidate로 페이지 갱신됨
  }

  const dailyInfoModal = showInfo && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setShowInfo(false)}
    >
      <div
        className="card-brutal bg-background max-w-sm w-full mx-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-black uppercase">데일리 미션이란?</h3>
          <button
            type="button"
            onClick={() => setShowInfo(false)}
            className="text-muted-foreground hover:text-foreground font-bold"
          >
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

  // 이번 주 진행 상황 UI
  const progressBar = (
    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-3">
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
      <button
        type="button"
        onClick={() => setShowInfo(true)}
        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        데일리 미션이란 ?
      </button>
    </div>
  );

  // 오늘 제출 완료 상태 표시
  if (todaySubmission) {
    const status = STATUS_MAP[todaySubmission.status];
    return (
      <div className="space-y-4">
        {dailyInfoModal}
        {progressBar}
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 text-xs font-bold uppercase border-2 border-border ${status.className}`}>
            오늘 {status.label}
          </span>
          {todaySubmission.status === 'approved' && (
            <span className="font-mono font-bold text-sm">+1pt</span>
          )}
        </div>
        {todaySubmission.image_url && (
          <div className="border-2 border-border p-2">
            <ImageWithLightbox
              src={todaySubmission.image_url}
              alt="오늘 제출 이미지"
              width={600}
              height={400}
              className="w-full max-h-48 object-contain"
            />
          </div>
        )}
        <p className="text-xs text-muted-foreground">하루 1회 · 주 최대 3회 · 1pt 고정 · 월~일 기준</p>
      </div>
    );
  }

  // 이번 주 완료
  if (isWeekComplete) {
    return (
      <div className="space-y-4">
        {dailyInfoModal}
        {progressBar}
        <div className="border-2 border-border p-4 bg-muted">
          <p className="text-sm font-bold">이번 주 데일리 미션 완료! (3/3회)</p>
        </div>
        <p className="text-xs text-muted-foreground">하루 1회 · 주 최대 3회 · 1pt 고정 · 월~일 기준</p>
      </div>
    );
  }

  // 제출 폼
  if (!canSubmitToday) return null;

  return (
    <div className="space-y-4">
      {dailyInfoModal}
      {progressBar}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 이미지 선택 */}
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="btn-brutal bg-muted text-foreground"
        >
          {file ? '다른 이미지 선택' : '이미지 선택'}
        </button>
      </div>

      {preview && (
        <div className="border-2 border-border p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="미리보기" className="w-full max-h-48 object-contain" />
        </div>
      )}

      {/* 수행 날짜 */}
      <div className="space-y-1">
        <label className="text-sm font-bold">
          수행 날짜 <span className="text-destructive">*</span>
        </label>
        <input
          type="date"
          value={completedAt}
          onChange={(e) => setCompletedAt(e.target.value)}
          className="input-brutal w-full"
        />
      </div>

      {/* 메모 (선택) */}
      <div className="space-y-1">
        <label className="text-sm font-bold">
          메모 <span className="text-muted-foreground font-normal">(선택 · 입력 시 5자 이상)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="미션 수행에 대한 메모를 남겨주세요"
          rows={2}
          className="input-brutal w-full resize-none"
        />
        {noteInvalid && (
          <p className="text-xs text-destructive font-bold">5자 이상 입력하거나 비워두세요 ({noteLen}자)</p>
        )}
      </div>

      {file && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !completedAt || noteInvalid}
          className="btn-brutal w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '제출 중...' : '오늘 제출하기'}
        </button>
      )}

      <p className="text-xs text-muted-foreground">하루 1회 · 주 최대 3회 · 1pt 고정 · 월~일 기준</p>
    </div>
  );
}
