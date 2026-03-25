'use client';

import { useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { uploadDailyImage } from '@/lib/storage/upload';
import { submitDailyMission, updateDailyMission, resubmitDailyMission } from '@/lib/actions/daily-submissions';
import type { DailySubmission, TeamDailySubmission } from '@/lib/queries/daily-submissions';
import { ImageWithLightbox } from '@/components/features/missions/ImageWithLightbox';

interface DailyMissionSectionProps {
  meetingId: string;
  teamId: string;
  userId: string;
  weekSubmissions: DailySubmission[];
  weeklyCount: number; // rejected 제외 이번 주 제출 횟수
  teamSubmissions?: TeamDailySubmission[];
}

const STATUS_MAP = {
  pending: { label: '심사 중', className: 'bg-muted text-muted-foreground' },
  approved: { label: '승인', className: 'bg-primary text-primary-foreground' },
  rejected: { label: '반려', className: 'bg-destructive text-destructive-foreground' },
} as const;

/** KST 기준 오늘 날짜 문자열 */
function getKSTToday(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
}

/** KST 기준 이번 주 월요일(시작) ~ 일요일(끝) 계산 */
function getKSTWeekBounds(): { weekStart: string; weekEnd: string } {
  const today = getKSTToday();
  const date = new Date(today);
  const day = date.getDay(); // 0=일, 1=월 ... 6=토
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  const weekStart = monday.toISOString().split('T')[0];
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekEnd = sunday.toISOString().split('T')[0];
  return { weekStart, weekEnd };
}

export default function DailyMissionSection({
  meetingId,
  teamId,
  userId,
  weekSubmissions,
  weeklyCount,
  teamSubmissions = [],
}: DailyMissionSectionProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [completedAt, setCompletedAt] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 수정 모달 상태
  const [editingSubmission, setEditingSubmission] = useState<DailySubmission | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // 재제출 모달 상태
  const [resubmittingSubmission, setResubmittingSubmission] = useState<DailySubmission | null>(null);
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [resubmitPreview, setResubmitPreview] = useState<string | null>(null);
  const [resubmitNote, setResubmitNote] = useState('');
  const [resubmitLoading, setResubmitLoading] = useState(false);
  const resubmitInputRef = useRef<HTMLInputElement>(null);

  const today = getKSTToday();
  const { weekStart, weekEnd } = useMemo(() => getKSTWeekBounds(), []);

  // 날짜 유효성 검사
  const isDateOutOfWeek =
    completedAt !== '' && (completedAt < weekStart || completedAt > weekEnd);
  const isDateFuture = completedAt !== '' && completedAt > today;
  const alreadySubmittedForDate =
    completedAt !== '' &&
    weekSubmissions.some(
      (s) => s.submitted_date === completedAt && s.status !== 'rejected'
    );

  const dateError = isDateFuture
    ? '미래 날짜로는 제출할 수 없습니다'
    : isDateOutOfWeek
    ? '이번 주(월~일) 날짜만 선택할 수 있습니다'
    : alreadySubmittedForDate
    ? '해당 날짜에 이미 제출한 미션이 있습니다'
    : null;

  const noteLen = note.trim().length;
  const noteInvalid = noteLen > 0 && noteLen < 5;

  const canSubmit =
    !!file && completedAt !== '' && !dateError && !noteInvalid && !loading;

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
    if (dateError) {
      toast.error(dateError);
      return;
    }
    if (noteInvalid) {
      toast.error('메모는 5자 이상 입력하거나 비워두세요');
      return;
    }

    setLoading(true);

    const uploadResult = await uploadDailyImage(file, meetingId, userId, completedAt);
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

  function handleOpenEdit(submission: DailySubmission) {
    setEditingSubmission(submission);
    setEditFile(null);
    setEditPreview(null);
    setEditNote(submission.note ?? '');
  }

  function handleCloseEdit() {
    setEditingSubmission(null);
    setEditFile(null);
    setEditPreview(null);
    setEditNote('');
  }

  function handleEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setEditFile(selected);
    setEditPreview(URL.createObjectURL(selected));
  }

  async function handleEditSubmit() {
    if (!editingSubmission) return;

    const editNoteLen = editNote.trim().length;
    if (editNoteLen > 0 && editNoteLen < 5) {
      toast.error('메모는 5자 이상 입력하거나 비워두세요');
      return;
    }

    setEditLoading(true);

    let imageUrl = editingSubmission.image_url;

    if (editFile) {
      const uploadResult = await uploadDailyImage(
        editFile,
        meetingId,
        userId,
        editingSubmission.submitted_date
      );
      if (!uploadResult.success || !uploadResult.url) {
        toast.error(uploadResult.error ?? '업로드 실패');
        setEditLoading(false);
        return;
      }
      imageUrl = uploadResult.url;
    }

    const result = await updateDailyMission(
      editingSubmission.id,
      userId,
      meetingId,
      imageUrl,
      editNote || undefined
    );

    setEditLoading(false);

    if (!result.success) {
      toast.error(result.error ?? '수정 실패');
    } else {
      handleCloseEdit();
    }
  }

  const editNoteLen = editNote.trim().length;
  const editNoteInvalid = editNoteLen > 0 && editNoteLen < 5;
  const canEditSubmit = !editNoteInvalid && !editLoading;

  function handleOpenResubmit(submission: DailySubmission) {
    setResubmittingSubmission(submission);
    setResubmitFile(null);
    setResubmitPreview(null);
    setResubmitNote(submission.note ?? '');
  }

  function handleCloseResubmit() {
    setResubmittingSubmission(null);
    setResubmitFile(null);
    setResubmitPreview(null);
    setResubmitNote('');
  }

  function handleResubmitFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setResubmitFile(selected);
    setResubmitPreview(URL.createObjectURL(selected));
  }

  async function handleResubmitSubmit() {
    if (!resubmittingSubmission) return;
    if (!resubmitFile) {
      toast.error('새 이미지를 선택해주세요');
      return;
    }
    const resubmitNoteLen = resubmitNote.trim().length;
    if (resubmitNoteLen > 0 && resubmitNoteLen < 5) {
      toast.error('메모는 5자 이상 입력하거나 비워두세요');
      return;
    }

    setResubmitLoading(true);

    const uploadResult = await uploadDailyImage(
      resubmitFile,
      meetingId,
      userId,
      resubmittingSubmission.submitted_date
    );
    if (!uploadResult.success || !uploadResult.url) {
      toast.error(uploadResult.error ?? '업로드 실패');
      setResubmitLoading(false);
      return;
    }

    const result = await resubmitDailyMission(
      resubmittingSubmission.id,
      userId,
      meetingId,
      uploadResult.url,
      resubmitNote || undefined
    );

    setResubmitLoading(false);

    if (!result.success) {
      toast.error(result.error ?? '재제출 실패');
    } else {
      handleCloseResubmit();
    }
  }

  const resubmitNoteLen = resubmitNote.trim().length;
  const resubmitNoteInvalid = resubmitNoteLen > 0 && resubmitNoteLen < 5;

  const editModal = editingSubmission && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleCloseEdit}
    >
      <div
        className="card-brutal bg-background max-w-sm w-full mx-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-black uppercase">제출 수정</h3>
          <button
            type="button"
            onClick={handleCloseEdit}
            className="text-muted-foreground hover:text-foreground font-bold"
          >
            ✕
          </button>
        </div>

        <p className="text-sm font-mono text-muted-foreground">{editingSubmission.submitted_date}</p>

        {/* 현재 이미지 */}
        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground mb-2">현재 이미지</p>
          <div className="border-2 border-border p-2">
            {editPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={editPreview} alt="새 이미지 미리보기" className="w-full max-h-48 object-contain" />
            ) : (
              <ImageWithLightbox
                src={editingSubmission.image_url}
                alt="현재 제출 이미지"
                width={400}
                height={300}
                className="w-full max-h-48 object-contain"
              />
            )}
          </div>
        </div>

        <input
          ref={editInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleEditFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => editInputRef.current?.click()}
          disabled={editLoading}
          className="btn-brutal bg-muted text-foreground w-full"
        >
          {editFile ? '다른 이미지로 변경' : '이미지 변경'}
        </button>

        {/* 메모 */}
        <div className="space-y-1">
          <label className="text-sm font-bold">
            메모 <span className="text-muted-foreground font-normal">(선택 · 입력 시 5자 이상)</span>
          </label>
          <textarea
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="메모를 남겨주세요"
            rows={2}
            className="input-brutal w-full resize-none"
          />
          {editNoteInvalid && (
            <p className="text-xs text-destructive font-bold">5자 이상 입력하거나 비워두세요 ({editNoteLen}자)</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCloseEdit}
            className="btn-brutal bg-muted text-foreground flex-1"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleEditSubmit}
            disabled={!canEditSubmit}
            className="btn-brutal flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {editLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );

  const resubmitModal = resubmittingSubmission && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleCloseResubmit}
    >
      <div
        className="card-brutal bg-background max-w-sm w-full mx-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-black uppercase">재제출</h3>
          <button
            type="button"
            onClick={handleCloseResubmit}
            className="text-muted-foreground hover:text-foreground font-bold"
          >
            ✕
          </button>
        </div>

        <p className="text-sm font-mono text-muted-foreground">{resubmittingSubmission.submitted_date}</p>

        {resubmittingSubmission.rejection_reason && (
          <div className="border-l-4 border-destructive pl-3 space-y-0.5">
            <p className="text-xs font-bold text-destructive uppercase">반려 사유</p>
            <p className="text-sm">{resubmittingSubmission.rejection_reason}</p>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
            {resubmitPreview ? '새 이미지 미리보기' : '새 이미지 선택 필요'}
          </p>
          {resubmitPreview ? (
            <div className="border-2 border-border p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resubmitPreview} alt="재제출 이미지 미리보기" className="w-full max-h-48 object-contain" />
            </div>
          ) : (
            <div className="border-2 border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              이미지를 선택해주세요
            </div>
          )}
        </div>

        <input
          ref={resubmitInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleResubmitFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => resubmitInputRef.current?.click()}
          disabled={resubmitLoading}
          className="btn-brutal bg-muted text-foreground w-full"
        >
          {resubmitFile ? '다른 이미지 선택' : '이미지 선택'}
        </button>

        <div className="space-y-1">
          <label className="text-sm font-bold">
            메모 <span className="text-muted-foreground font-normal">(선택 · 입력 시 5자 이상)</span>
          </label>
          <textarea
            value={resubmitNote}
            onChange={(e) => setResubmitNote(e.target.value)}
            placeholder="메모를 남겨주세요"
            rows={2}
            className="input-brutal w-full resize-none"
          />
          {resubmitNoteInvalid && (
            <p className="text-xs text-destructive font-bold">5자 이상 입력하거나 비워두세요 ({resubmitNoteLen}자)</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCloseResubmit}
            className="btn-brutal bg-muted text-foreground flex-1"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleResubmitSubmit}
            disabled={!resubmitFile || resubmitNoteInvalid || resubmitLoading}
            className="btn-brutal flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {resubmitLoading ? '제출 중...' : '재제출하기'}
          </button>
        </div>
      </div>
    </div>
  );

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
            <li>■ 데일리 미션은 수행 당 3점이 부여됩니다</li>
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

  // 이번 주 제출 내역 표시 (거절 포함 전체)
  const submittedDates = weekSubmissions;
  // 팀원 제출 내역 (본인 제외)
  const teammateSubmissions = teamSubmissions.filter((s) => s.submitted_by !== userId);

  return (
    <div className="space-y-4">
      {editModal}
      {resubmitModal}
      {dailyInfoModal}
      {progressBar}

      {/* 이번 주 제출 현황 */}
      {(submittedDates.length > 0 || teammateSubmissions.length > 0) && (
        <div className="space-y-2">
          {submittedDates.length > 0 && (
            <>
              <p className="text-xs font-bold text-muted-foreground uppercase">내 제출 현황 ({submittedDates.length}/5)</p>
              {submittedDates.map((s) => {
                const status = STATUS_MAP[s.status];
                return (
                  <div key={s.id} className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm">{s.submitted_date}</span>
                      <span className={`px-2 py-0.5 text-xs font-bold border-2 border-border ${status.className}`}>
                        {status.label}
                      </span>
                      {s.status === 'approved' && (
                        <span className="font-mono font-bold text-sm">+3pt</span>
                      )}
                      {s.image_url && (
                        <div className="border border-border">
                          <ImageWithLightbox
                            src={s.image_url}
                            alt={`${s.submitted_date} 제출 이미지`}
                            width={200}
                            height={120}
                            className="w-16 h-10 object-cover"
                          />
                        </div>
                      )}
                      {s.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          className="px-2 py-0.5 text-xs font-bold border-2 border-foreground hover:bg-foreground hover:text-background transition-colors"
                        >
                          수정
                        </button>
                      )}
                      {s.status === 'rejected' && (
                        <button
                          type="button"
                          onClick={() => handleOpenResubmit(s)}
                          className="px-2 py-0.5 text-xs font-bold border-2 border-foreground hover:bg-foreground hover:text-background transition-colors"
                        >
                          재제출
                        </button>
                      )}
                    </div>
                    {s.status === 'rejected' && s.rejection_reason && (
                      <p className="text-xs text-destructive pl-1">반려 사유: {s.rejection_reason}</p>
                    )}
                  </div>
                );
              })}
            </>
          )}
          {teammateSubmissions.length > 0 && (
            <p className="text-xs font-bold text-muted-foreground uppercase pt-1">팀원 제출 현황</p>
          )}
          {teammateSubmissions.map((s) => {
            const status = STATUS_MAP[s.status];
            return (
              <div key={s.id} className="flex items-center gap-3">
                <span className="font-mono text-sm">{s.submitted_date}</span>
                <span className="text-sm font-bold truncate max-w-[80px]">{s.submitter_name ?? '-'}</span>
                <span className={`px-2 py-0.5 text-xs font-bold border-2 border-border ${status.className}`}>
                  {status.label}
                </span>
                {s.status === 'approved' && (
                  <span className="font-mono font-bold text-sm">+3pt</span>
                )}
                {s.image_url && (
                  <div className="border border-border">
                    <ImageWithLightbox
                      src={s.image_url}
                      alt={`${s.submitted_date} ${s.submitter_name} 제출 이미지`}
                      width={200}
                      height={120}
                      className="w-16 h-10 object-cover"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
          <span className="font-normal text-muted-foreground ml-1">(이번 주 월~일만 선택 가능)</span>
        </label>
        <input
          type="date"
          value={completedAt}
          min={weekStart}
          max={today}
          onChange={(e) => setCompletedAt(e.target.value)}
          className="input-brutal w-full"
        />
        {dateError && (
          <p className="text-xs text-destructive font-bold">{dateError}</p>
        )}
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
          disabled={!canSubmit}
          className="btn-brutal w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '제출 중...' : '제출하기'}
        </button>
      )}

      <p className="text-xs text-muted-foreground">하루 1회 · 주 최대 5회 · 3pt 고정 · 월~일 기준</p>
    </div>
  );
}
