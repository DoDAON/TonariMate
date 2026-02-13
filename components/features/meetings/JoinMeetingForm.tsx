'use client';

import { useState } from 'react';
import { joinMeeting } from '@/lib/actions/meetings';

interface JoinMeetingFormProps {
  userId: string;
}

export function JoinMeetingForm({ userId }: JoinMeetingFormProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmed = code.trim();
    if (!trimmed) {
      setError('초대 코드를 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await joinMeeting(userId, trimmed);

    if (!result.success) {
      setError(result.error ?? '알 수 없는 오류가 발생했습니다');
      setLoading(false);
      return;
    }

    setSuccess(`"${result.meetingName}" 모임에 참여했습니다!`);
    setCode('');
    setLoading(false);
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="초대 코드 입력"
          className="input-brutal flex-1"
          maxLength={20}
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-brutal touch-target px-6 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '참여 중...' : '참여'}
        </button>
      </form>
      {error && (
        <p className="text-destructive text-sm font-medium mt-2">{error}</p>
      )}
      {success && (
        <p className="text-sm font-medium mt-2">{success}</p>
      )}
    </div>
  );
}
