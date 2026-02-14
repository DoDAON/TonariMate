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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

    setLoading(true);
    setError(null);

    // 1. 이미지 업로드
    const uploadResult = await uploadMissionImage(file, meetingId, missionId, teamId);
    if (!uploadResult.success || !uploadResult.url) {
      setError(uploadResult.error ?? '업로드 실패');
      setLoading(false);
      return;
    }

    // 2. 제출 INSERT
    const submitResult = await submitMission(missionId, meetingId, teamId, userId, uploadResult.url);
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

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="btn-brutal bg-muted text-foreground"
        >
          {file ? '다른 이미지 선택' : '이미지 선택'}
        </button>

        {file && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn-brutal"
          >
            {loading ? '제출 중...' : '제출하기'}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive font-bold">{error}</p>
      )}
    </div>
  );
}
