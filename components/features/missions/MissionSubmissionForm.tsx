'use client';

import { useState, useRef } from 'react';
import { uploadMissionImage } from '@/lib/storage/upload';
import { submitMission, updateSubmission } from '@/lib/actions/submissions';

interface InitialValues {
  imageUrl?: string;
  note?: string;
  completedAt?: string;
  textContent?: string;
}

interface MissionSubmissionFormProps {
  missionId: string;
  meetingId: string;
  teamId: string;
  userId: string;
  missionType: 'weekly' | 'team_naming';
  submissionId?: string;
  initialValues?: InitialValues;
}

export default function MissionSubmissionForm({
  missionId,
  meetingId,
  teamId,
  userId,
  missionType,
  submissionId,
  initialValues,
}: MissionSubmissionFormProps) {
  const isTeamNaming = missionType === 'team_naming';
  const isUpdateMode = !!submissionId;

  // 일반 미션용 state
  const [preview, setPreview] = useState<string | null>(initialValues?.imageUrl ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState(initialValues?.note ?? '');
  const [completedAt, setCompletedAt] = useState(initialValues?.completedAt ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  // 조 이름 정하기용 state
  const [teamName, setTeamName] = useState(initialValues?.textContent ?? '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const noteLength = note.trim().length;
  const noteInvalid = noteLength > 0 && noteLength < 5;

  const teamNameLen = teamName.trim().length;
  const teamNameInvalid = teamNameLen > 0 && (teamNameLen < 2 || teamNameLen > 10);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleSubmit() {
    if (isTeamNaming) {
      if (teamNameLen < 2 || teamNameLen > 10) {
        setError('조 이름은 2~10자로 입력해주세요');
        return;
      }
    } else {
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
    }

    setLoading(true);
    setError(null);

    if (isTeamNaming) {
      const result = isUpdateMode
        ? await updateSubmission(submissionId!, meetingId, missionId, null, undefined, undefined, teamName.trim())
        : await submitMission(missionId, meetingId, teamId, userId, null, undefined, undefined, teamName.trim());
      if (!result.success) {
        setError(result.error ?? '제출 실패');
        setLoading(false);
        return;
      }
    } else {
      let imageUrl: string | null = null;

      if (file) {
        const uploadResult = await uploadMissionImage(file, meetingId, missionId, teamId);
        if (!uploadResult.success || !uploadResult.url) {
          setError(uploadResult.error ?? '업로드 실패');
          setLoading(false);
          return;
        }
        imageUrl = uploadResult.url;
      } else if (isUpdateMode && initialValues?.imageUrl) {
        imageUrl = initialValues.imageUrl;
      } else {
        setError('이미지를 선택해주세요');
        setLoading(false);
        return;
      }

      const result = isUpdateMode
        ? await updateSubmission(submissionId!, meetingId, missionId, imageUrl, note || undefined, completedAt || undefined)
        : await submitMission(missionId, meetingId, teamId, userId, imageUrl, note || undefined, completedAt || undefined);
      if (!result.success) {
        setError(result.error ?? '제출 실패');
        setLoading(false);
        return;
      }
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="card-brutal bg-muted">
        <p className="text-sm font-bold">
          {isUpdateMode ? '수정 완료! 심사 결과를 기다려주세요.' : '제출 완료! 심사 결과를 기다려주세요.'}
        </p>
      </div>
    );
  }

  if (isTeamNaming) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-bold">
            조 이름 <span className="text-destructive">*</span>{' '}
            <span className="text-muted-foreground font-normal">(2~10자)</span>
          </label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="조 이름을 입력하세요"
            maxLength={10}
            className="input-brutal w-full"
          />
          {teamNameInvalid && (
            <p className="text-xs text-destructive font-bold">2~10자로 입력해주세요 ({teamNameLen}자)</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || teamNameLen < 2 || teamNameLen > 10}
          className="btn-brutal w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '처리 중...' : isUpdateMode ? '수정하기' : '제출하기'}
        </button>

        {error && <p className="text-sm text-destructive font-bold">{error}</p>}
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

      {(preview || (isUpdateMode && initialValues?.imageUrl && !file)) && (
        <div className="border-2 border-border p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview ?? initialValues?.imageUrl}
            alt="미리보기"
            className="w-full max-h-64 object-contain"
          />
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
          required
        />
      </div>

      {/* 메모 */}
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

      {(file || (isUpdateMode && initialValues?.imageUrl)) && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || noteInvalid || !completedAt}
          className="btn-brutal w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '처리 중...' : isUpdateMode ? '수정하기' : '제출하기'}
        </button>
      )}

      {error && (
        <p className="text-sm text-destructive font-bold">{error}</p>
      )}
    </div>
  );
}
