'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { setUserRole, updateUserInfo, deleteUser, fetchUserMeetings } from '@/lib/actions/admin-users';
import { ROUTES } from '@/lib/constants/routes';
import type { AdminUserSummary } from '@/lib/queries/admin';
import type { UserMeeting } from '@/lib/actions/admin-users';

interface AdminUserListProps {
  users: AdminUserSummary[];
  currentUserId: string;
}

type ModalType = 'detail' | 'edit' | 'delete' | null;

export function AdminUserList({ users, currentUserId }: AdminUserListProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // 상세 모달 - 모임 목록
  const [meetings, setMeetings] = useState<UserMeeting[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);

  // 정보수정 모달 - 폼 상태
  const [editName, setEditName] = useState('');
  const [editStudentId, setEditStudentId] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // 회원탈퇴 모달
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openModal(type: ModalType, user: AdminUserSummary) {
    setSelectedUser(user);
    setModal(type);
    if (type === 'detail') {
      setMeetings([]);
      setMeetingsLoading(true);
      fetchUserMeetings(user.id).then((data) => {
        setMeetings(data);
        setMeetingsLoading(false);
      });
    }
    if (type === 'edit') {
      setEditName(user.name);
      setEditStudentId(user.student_id ?? '');
      setEditError('');
    }
  }

  function closeModal() {
    setModal(null);
    setSelectedUser(null);
  }

  async function handleRoleToggle(user: AdminUserSummary) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const label = newRole === 'admin' ? '관리자' : '일반';
    if (!confirm(`"${user.name}"의 역할을 ${label}로 변경하시겠습니까?`)) return;

    setLoadingId(user.id);
    const result = await setUserRole(user.id, newRole);
    setLoadingId(null);

    if (!result.success) {
      toast.error(result.error ?? '역할 변경에 실패했습니다');
    } else {
      toast.success(`${user.name}의 역할이 ${label}로 변경되었습니다`);
      router.refresh();
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setEditLoading(true);
    setEditError('');
    const result = await updateUserInfo(selectedUser.id, editName, editStudentId);
    setEditLoading(false);
    if (!result.success) {
      setEditError(result.error ?? '수정에 실패했습니다');
    } else {
      toast.success('정보가 수정되었습니다');
      closeModal();
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!selectedUser) return;
    setDeleteLoading(true);
    const result = await deleteUser(selectedUser.id);
    setDeleteLoading(false);
    if (!result.success) {
      toast.error(result.error ?? '회원탈퇴 처리에 실패했습니다');
    } else {
      toast.success(`${selectedUser.name} 유저가 탈퇴 처리되었습니다`);
      closeModal();
      router.refresh();
    }
  }

  const editStudentIdInvalid = editStudentId.trim().length > 0 && editStudentId.trim().length !== 8;

  if (users.length === 0) {
    return <p className="text-muted-foreground text-sm">등록된 유저가 없습니다.</p>;
  }

  return (
    <>
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="card-brutal">
            <div className="flex items-center gap-3">
              {/* 아바타 */}
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

              {/* 유저 정보 */}
              <div className="flex-1 min-w-0">
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

            {/* 버튼 줄 */}
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                type="button"
                onClick={() => openModal('detail', user)}
                className="btn-brutal bg-muted text-foreground text-xs px-3 py-1.5"
              >
                상세정보
              </button>
              <button
                type="button"
                onClick={() => openModal('edit', user)}
                className="btn-brutal bg-muted text-foreground text-xs px-3 py-1.5"
              >
                정보수정
              </button>
              <button
                type="button"
                onClick={() => openModal('delete', user)}
                disabled={user.id === currentUserId}
                className="btn-brutal bg-destructive text-destructive-foreground text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                회원탈퇴
              </button>
              <button
                type="button"
                disabled={loadingId === user.id || user.id === currentUserId}
                onClick={() => handleRoleToggle(user)}
                className="btn-brutal text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
              >
                {loadingId === user.id
                  ? '변경 중...'
                  : user.role === 'admin'
                  ? '일반으로'
                  : '관리자로'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── 상세정보 모달 ── */}
      {modal === 'detail' && selectedUser && (
        <ModalOverlay onClose={closeModal}>
          <h3 className="text-lg font-black uppercase mb-4">상세정보</h3>

          <div className="flex items-center gap-3 mb-4">
            {selectedUser.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={selectedUser.avatar_url}
                alt={selectedUser.name}
                className="w-14 h-14 border-2 border-foreground object-cover"
              />
            ) : (
              <div className="w-14 h-14 border-2 border-foreground bg-muted" />
            )}
            <div>
              <p className="font-bold text-lg">{selectedUser.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{selectedUser.email}</p>
            </div>
          </div>

          <dl className="text-sm space-y-1 mb-4">
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-16 shrink-0">학번</dt>
              <dd className="font-mono">{selectedUser.student_id ?? '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-16 shrink-0">역할</dt>
              <dd className="font-bold">{selectedUser.role === 'admin' ? 'ADMIN' : 'USER'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-16 shrink-0">가입일</dt>
              <dd className="font-mono">{new Date(selectedUser.created_at).toLocaleDateString('ko-KR')}</dd>
            </div>
          </dl>

          <div>
            <h4 className="text-sm font-bold uppercase mb-2">참여 모임</h4>
            {meetingsLoading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : meetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">참여 중인 모임이 없습니다</p>
            ) : (
              <ul className="space-y-1">
                {meetings.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={ROUTES.ADMIN_MEETING(m.id)}
                      onClick={closeModal}
                      className="flex items-center justify-between p-2 bg-muted border-2 border-border hover:border-foreground transition-colors"
                    >
                      <span className="text-sm font-bold">{m.name}</span>
                      <span className="text-xs text-muted-foreground">{m.period}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="btn-brutal w-full mt-4 bg-muted text-foreground"
          >
            닫기
          </button>
        </ModalOverlay>
      )}

      {/* ── 정보수정 모달 ── */}
      {modal === 'edit' && selectedUser && (
        <ModalOverlay onClose={closeModal}>
          <h3 className="text-lg font-black uppercase mb-4">정보수정</h3>
          <p className="text-sm text-muted-foreground mb-4">{selectedUser.name} ({selectedUser.email})</p>

          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold uppercase mb-1">
                이름 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input-brutal w-full"
                maxLength={50}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase mb-1">
                학번 <span className="text-muted-foreground font-normal text-xs">(8자리)</span>
              </label>
              <input
                type="text"
                value={editStudentId}
                onChange={(e) => setEditStudentId(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className="input-brutal w-full"
                maxLength={8}
                placeholder="20241234"
              />
              {editStudentIdInvalid && (
                <p className="text-xs text-destructive font-bold mt-1">학번은 8자리여야 합니다</p>
              )}
            </div>
            {editError && <p className="text-sm text-destructive font-bold">{editError}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={editLoading || editStudentIdInvalid}
                className="btn-brutal flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {editLoading ? '저장 중...' : '저장'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="btn-brutal flex-1 bg-muted text-foreground"
              >
                취소
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* ── 회원탈퇴 모달 ── */}
      {modal === 'delete' && selectedUser && (
        <ModalOverlay onClose={closeModal}>
          <div className="text-center mb-4">
            <p className="text-2xl mb-2">⚠️</p>
            <h3 className="text-lg font-black uppercase">회원탈퇴 확인</h3>
          </div>

          <div className="card-brutal bg-destructive/10 border-destructive mb-4">
            <p className="text-sm font-bold text-destructive">이 작업은 되돌릴 수 없습니다.</p>
            <p className="text-sm mt-1">
              <span className="font-bold">{selectedUser.name}</span> 유저를 탈퇴 처리하면 모든 모임/팀 배정 데이터가 삭제됩니다.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              * 탈퇴 후 동일 Google 계정으로 재가입이 가능합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="btn-brutal flex-1 bg-destructive text-destructive-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deleteLoading ? '처리 중...' : '탈퇴 확인'}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="btn-brutal flex-1 bg-muted text-foreground"
            >
              취소
            </button>
          </div>
        </ModalOverlay>
      )}
    </>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  // ESC 키로 닫기
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card-brutal w-full max-w-sm max-h-[85vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
