'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { regenerateInviteCode } from '@/lib/actions/admin-meetings';

interface InviteCodeDisplayProps {
  meetingId: string;
  inviteCode: string;
}

export function InviteCodeDisplay({ meetingId, inviteCode }: InviteCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success('초대 코드 복사됨');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    if (!confirm('초대코드를 재생성하면 기존 코드는 사용할 수 없습니다. 계속하시겠습니까?')) {
      return;
    }
    setRegenerating(true);
    await regenerateInviteCode(meetingId);
    setRegenerating(false);
  }

  return (
    <div className="flex items-center gap-3">
      <code className="font-mono text-2xl font-black tracking-widest bg-muted px-4 py-2 border-2 border-border">
        {inviteCode}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className="btn-brutal bg-muted text-foreground text-sm"
      >
        {copied ? '복사됨!' : '복사'}
      </button>
      <button
        type="button"
        onClick={handleRegenerate}
        disabled={regenerating}
        className="btn-brutal bg-muted text-foreground text-sm"
      >
        {regenerating ? '...' : '재생성'}
      </button>
    </div>
  );
}
