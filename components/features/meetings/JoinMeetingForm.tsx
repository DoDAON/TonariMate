'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface JoinMeetingFormProps {
  userId: string;
}

export function JoinMeetingForm({ userId }: JoinMeetingFormProps) {
  const router = useRouter();
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

    const supabase = createClient();

    // 1. 초대 코드로 모임 조회
    const { data: meeting, error: findError } = await supabase
      .from('meetings')
      .select('id, name')
      .eq('invite_code', trimmed)
      .eq('is_active', true)
      .single();

    if (findError || !meeting) {
      setError('유효하지 않은 초대 코드입니다');
      setLoading(false);
      return;
    }

    // 2. 모임 참여
    const { error: joinError } = await supabase
      .from('meeting_members')
      .insert({
        meeting_id: meeting.id,
        user_id: userId,
        role: 'member',
      });

    if (joinError) {
      // unique constraint violation = 이미 참여
      if (joinError.code === '23505') {
        setError('이미 참여한 모임입니다');
      } else {
        setError('모임 참여에 실패했습니다. 다시 시도해주세요.');
      }
      setLoading(false);
      return;
    }

    setSuccess(`"${meeting.name}" 모임에 참여했습니다!`);
    setCode('');
    setLoading(false);
    router.refresh();
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
