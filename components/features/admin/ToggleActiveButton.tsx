'use client';

import { useState } from 'react';
import { toggleMeetingActive } from '@/lib/actions/admin-meetings';

interface ToggleActiveButtonProps {
  meetingId: string;
  isActive: boolean;
}

export function ToggleActiveButton({ meetingId, isActive }: ToggleActiveButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    await toggleMeetingActive(meetingId);
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`btn-brutal text-sm ${
        isActive ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
      }`}
    >
      {loading ? '...' : isActive ? '비활성화' : '활성화'}
    </button>
  );
}
