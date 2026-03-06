'use client';

import { useState, useRef } from 'react';
import { uploadMissionImage } from '@/lib/storage/upload';
import { submitMission } from '@/lib/actions/submissions';

interface MissionSubmissionFormProps {
  missionId: string;
  meetingId: string;
  teamId: string;
  userId: string;
}

export default function MissionSubmissionForm({
  missionId,
  meetingId,
  teamId,
  userId,
}: MissionSubmissionFormProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const noteLength = note.trim().length;
  const noteInvalid = noteLength > 0 && noteLength < 5;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError(null);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleSubmit() {
    if (!file) {
      setError('이미지를 선택해주세요');
      return;
    }
    if (!completedAt) {
      setError('수행 날짜를 입력해주세요');
      return;
    }
    if (noteInvalid) {
      setError('메모는 5자 이상 입력하거나 비워두세요');
      return;
    }

    setLoading(true);
    setError(null);

    const uploadResult = await uploadMissionImage(file, meetingId, missionId, teamId);
    if (!uploadResult.success || !uploadResult.url) {
      setError(uploadResult.error ?? '업로드 실패');
      setLoading(false);
      return;
    }

    const submitResult = await submitMission(
      missionId,
      meetingId,
      teamId,
      userId,
      uploadResult.url,
      note || undefined,
      completedAt || undefined
    );
    if (!submitResult.success) {
      setError(submitResult.error ?? '제출 실패');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="card-brutal bg-muted">
        <p className="text-sm font-bold">제출 완료! 심사 결과를 기다려주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          <img
            src={preview}
            alt="미리보기"
            className="w-full max-h-64 object-contain"
          />
        </div>
      )}

      {/* 수행 날짜 (필수) */}
      <div className="space-y-1">
        <label className="text-sm font-bold">
          수행 날짜 <span className="text-destructive">*</span>
        </label>
        <input
          type="date"
          value={completedAt}
          onChange={(e) => setCompletedAt(e.target.value)}
          className="input-brutal w-full"
          required
        />
      </div>

      {/* 메모 (선택, 최소 5자) */}
      <div className="space-y-1">
        <label className="text-sm font-bold">
          메모 <span className="text-muted-foreground font-normal">(선택 · 입력 시 5자 이상)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="미션 수행에 대한 메모를 남겨주세요"
          rows={3}
          className="input-brutal w-full resize-none"
        />
        {noteInvalid && (
          <p className="text-xs text-destructive font-bold">5자 이상 입력하거나 비워두세요 ({noteLength}자)</p>
        )}
      </div>

      {file && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || noteInvalid || !completedAt}
          className="btn-brutal w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '제출 중...' : '제출하기'}
        </button>
      )}

      {error && (
        <p className="text-sm text-destructive font-bold">{error}</p>
      )}
    </div>
  );
}
