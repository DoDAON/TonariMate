'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMission, updateMission } from '@/lib/actions/admin-missions';
import { ROUTES } from '@/lib/constants/routes';

type MissionType = 'weekly' | 'team_naming';
type EndDateOption = '1week' | '2weeks';

interface MissionFormProps {
  meetingId: string;
  mode: 'create' | 'edit';
  missionId?: string;
  defaultValues?: {
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    mission_type?: MissionType;
  };
  /** edit 모드에서 종료일이 이미 지났는지 여부 */
  isExpired?: boolean;
}

/** start_date로부터 N일 뒤 날짜 계산 (1주 후 = 6일, 2주 후 = 13일) */
function calcEndDate(startDate: string, option: EndDateOption): string {
  if (!startDate) return '';
  const date = new Date(startDate);
  const days = option === '1week' ? 6 : 13;
  const end = new Date(date);
  end.setDate(date.getDate() + days);
  return end.toISOString().split('T')[0];
}

/** 기존 종료일로부터 옵션 추정 */
function detectEndDateOption(startDate: string, endDate: string): EndDateOption {
  if (!startDate || !endDate) return '1week';
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 12 ? '2weeks' : '1week';
}

export function MissionForm({ meetingId, mode, missionId, defaultValues, isExpired }: MissionFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [missionType, setMissionType] = useState<MissionType>(
    defaultValues?.mission_type ?? 'weekly'
  );
  const [startDate, setStartDate] = useState(defaultValues?.start_date ?? '');
  const [endDateOption, setEndDateOption] = useState<EndDateOption>(
    mode === 'edit' && defaultValues?.start_date && defaultValues?.end_date
      ? detectEndDateOption(defaultValues.start_date, defaultValues.end_date)
      : '1week'
  );

  const computedEndDate = calcEndDate(startDate, endDateOption);

  const isTeamNaming = missionType === 'team_naming';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    // end_date hidden input은 폼에 포함됨

    const result =
      mode === 'create'
        ? await createMission(meetingId, formData)
        : await updateMission(missionId!, meetingId, formData);

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? '오류가 발생했습니다');
      return;
    }

    router.push(ROUTES.ADMIN_MEETING_MISSIONS(meetingId));
  }

  return (
    <form onSubmit={handleSubmit} className="card-brutal space-y-4">
      {/* 미션 종류 */}
      <div>
        <label className="block text-sm font-bold uppercase mb-1">미션 종류 *</label>
        <input type="hidden" name="mission_type" value={missionType} />
        {mode === 'edit' ? (
          // 수정 모드: 전체 선택지 표시 but 클릭 불가
          <div className="flex gap-2">
            {(['weekly', 'team_naming'] as MissionType[]).map((type) => (
              <div
                key={type}
                className={`px-4 py-2 text-sm font-bold border-2 transition-all duration-100 ${
                  missionType === type
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {type === 'weekly' ? '일반' : '조 이름 정하기'}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMissionType('weekly')}
              className={`px-4 py-2 text-sm font-bold border-2 border-foreground transition-all duration-100 ${
                missionType === 'weekly'
                  ? 'bg-foreground text-background'
                  : 'bg-background text-foreground hover:translate-x-[-1px] hover:translate-y-[-1px] hover:[box-shadow:2px_2px_0_var(--foreground)]'
              }`}
            >
              일반
            </button>
            <button
              type="button"
              onClick={() => setMissionType('team_naming')}
              className={`px-4 py-2 text-sm font-bold border-2 border-foreground transition-all duration-100 ${
                missionType === 'team_naming'
                  ? 'bg-foreground text-background'
                  : 'bg-background text-foreground hover:translate-x-[-1px] hover:translate-y-[-1px] hover:[box-shadow:2px_2px_0_var(--foreground)]'
              }`}
            >
              조 이름 정하기
            </button>
          </div>
        )}
      </div>

      {/* 제목 */}
      <div>
        <label htmlFor="title" className="block text-sm font-bold uppercase mb-1">
          제목 *
        </label>
        {isTeamNaming ? (
          <>
            <input type="hidden" name="title" value="조 이름 정하기" />
            <div className="input-brutal w-full bg-muted text-muted-foreground">조 이름 정하기</div>
          </>
        ) : (
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={defaultValues?.title ?? ''}
            className="input-brutal w-full"
            placeholder="미션 제목"
          />
        )}
      </div>

      {/* 설명 */}
      <div>
        <label htmlFor="description" className="block text-sm font-bold uppercase mb-1">
          설명 *
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          defaultValue={defaultValues?.description ?? ''}
          className="input-brutal w-full resize-none"
          placeholder="미션에 대한 상세 설명"
        />
      </div>

      {/* 날짜 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-bold uppercase mb-1">
            시작일 *
          </label>
          {mode === 'edit' ? (
            <>
              <input type="hidden" name="start_date" value={defaultValues?.start_date ?? ''} />
              <div className="input-brutal w-full bg-muted text-muted-foreground text-sm">
                {defaultValues?.start_date ?? '-'}
              </div>
            </>
          ) : (
            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-brutal w-full"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-bold uppercase mb-1">종료일 *</label>
          {mode === 'edit' ? (
            <>
              <input type="hidden" name="end_date" value={defaultValues?.end_date ?? ''} />
              <div className="input-brutal w-full bg-muted text-muted-foreground text-sm">
                {defaultValues?.end_date ?? '-'}
              </div>
            </>
          ) : (
            <>
              <input type="hidden" name="end_date" value={computedEndDate} />
              <select
                value={endDateOption}
                onChange={(e) => setEndDateOption(e.target.value as EndDateOption)}
                className="input-brutal w-full"
                disabled={!startDate}
              >
                <option value="1week">1주 후 (6일)</option>
                <option value="2weeks">2주 후 (13일)</option>
              </select>
              {computedEndDate && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">{computedEndDate}</p>
              )}
            </>
          )}
        </div>
      </div>

      {mode === 'edit' && isExpired && (
        <p className="text-sm text-muted-foreground border-2 border-border p-2 bg-muted">
          종료일이 지난 미션은 자동으로 &quot;종료&quot; 상태가 됩니다.
        </p>
      )}

      {error && <p className="text-sm text-destructive font-bold">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-brutal">
          {loading ? '처리 중...' : mode === 'create' ? '미션 생성' : '수정 완료'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-brutal bg-muted text-foreground"
        >
          취소
        </button>
      </div>
    </form>
  );
}
