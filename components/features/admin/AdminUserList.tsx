'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { setUserRole } from '@/lib/actions/admin-users';
import type { AdminUserSummary } from '@/lib/queries/admin';

interface AdminUserListProps {
  users: AdminUserSummary[];
  currentUserId: string;
}

export function AdminUserList({ users, currentUserId }: AdminUserListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleRoleToggle(user: AdminUserSummary) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const label = newRole === 'admin' ? '관리자' : '일반';
    if (!confirm(`"${user.name}"의 역할을 ${label}로 변경하시겠습니까?`)) return;

    setLoadingId(user.id);
    const result = await setUserRole(user.id, newRole, currentUserId);
    setLoadingId(null);

    if (!result.success) {
      toast.error(result.error ?? '역할 변경에 실패했습니다');
    } else {
      toast.success(`${user.name}의 역할이 ${label}로 변경되었습니다`);
    }
  }

  if (users.length === 0) {
    return <p className="text-muted-foreground text-sm">등록된 유저가 없습니다.</p>;
  }

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <div
          key={user.id}
          className="card-brutal flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            {user.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-10 h-10 border-2 border-foreground object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 border-2 border-foreground bg-muted shrink-0" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold truncate">{user.name}</span>
                {user.role === 'admin' && (
                  <span className="text-xs font-bold bg-foreground text-background px-1.5 py-0.5 shrink-0">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">{user.email}</p>
              {user.student_id && (
                <p className="text-xs text-muted-foreground">학번: {user.student_id}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            disabled={loadingId === user.id || user.id === currentUserId}
            onClick={() => handleRoleToggle(user)}
            className="btn-brutal text-sm shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loadingId === user.id
              ? '변경 중...'
              : user.role === 'admin'
              ? '일반으로'
              : '관리자로'}
          </button>
        </div>
      ))}
    </div>
  );
}
