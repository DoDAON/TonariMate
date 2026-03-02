'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { setupTeams, deleteTeam, updateTeamName, assignMember, removeMember, moveMember, kickMember } from '@/lib/actions/admin-teams';
import { formatTeamName } from '@/lib/utils';
import type { AdminTeam, UnassignedMember } from '@/lib/queries/admin-teams';

interface TeamManagementProps {
  meetingId: string;
  teams: AdminTeam[];
  unassignedMembers: UnassignedMember[];
}

interface DragData {
  type: 'move' | 'assign';
  teamMemberId?: string;
  userId: string;
  sourceTeamId?: string;
  label: string;
}

export function TeamManagement({ meetingId, teams, unassignedMembers }: TeamManagementProps) {
  const [setupCount, setSetupCount] = useState(teams.length || 4);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');

  // DnD state
  const [isDragging, setIsDragging] = useState(false);
  const [dragLabel, setDragLabel] = useState('');
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragDataRef = useRef<DragData | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const dropZoneRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 조 이름 편집
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');

  // 멤버 이동 편집
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  // ────────── 조 편성 ──────────
  async function handleSetup() {
    const teamsToRemove = teams.filter((t) => t.team_number > setupCount);
    const hasMembersInRemoved = teamsToRemove.some((t) => t.members.length > 0);

    if (hasMembersInRemoved) {
      const names = teamsToRemove
        .filter((t) => t.members.length > 0)
        .map((t) => `${t.team_number}조`)
        .join(', ');
      if (!confirm(`${names}에 멤버가 있습니다. 해당 멤버는 미배정 상태가 됩니다.\n계속하시겠습니까?`)) return;
    }

    setSetupLoading(true);
    setSetupError('');
    const result = await setupTeams(meetingId, setupCount);
    setSetupLoading(false);
    if (!result.success) setSetupError(result.error ?? '오류가 발생했습니다');
  }

  // ────────── DnD (Pointer Events) ──────────
  function registerDropZone(id: string) {
    return (el: HTMLDivElement | null) => {
      if (el) dropZoneRefs.current.set(id, el);
      else dropZoneRefs.current.delete(id);
    };
  }

  function findDropZone(x: number, y: number): string | null {
    for (const [id, el] of dropZoneRefs.current) {
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return id;
      }
    }
    return null;
  }

  function startDrag(e: React.PointerEvent, data: DragData) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragDataRef.current = data;
    setIsDragging(true);
    setDragLabel(data.label);
    setDraggingItemId(data.teamMemberId ?? data.userId);
    if (ghostRef.current) {
      ghostRef.current.style.left = `${e.clientX + 12}px`;
      ghostRef.current.style.top = `${e.clientY + 12}px`;
    }
  }

  function moveDrag(e: React.PointerEvent) {
    if (!dragDataRef.current) return;
    e.preventDefault();
    if (ghostRef.current) {
      ghostRef.current.style.left = `${e.clientX + 12}px`;
      ghostRef.current.style.top = `${e.clientY + 12}px`;
    }
    const found = findDropZone(e.clientX, e.clientY);
    setDragOverId((prev) => (prev !== found ? found : prev));
  }

  async function endDrag(e: React.PointerEvent) {
    const data = dragDataRef.current;
    if (!data) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

    const targetId = findDropZone(e.clientX, e.clientY);

    if (targetId) {
      if (targetId === 'unassigned') {
        if (data.type === 'move' && data.teamMemberId) {
          await removeMember(data.teamMemberId, meetingId);
        }
      } else if (data.type === 'move' && data.teamMemberId && data.sourceTeamId !== targetId) {
        await moveMember(data.teamMemberId, targetId, meetingId);
      } else if (data.type === 'assign') {
        await assignMember(targetId, data.userId, meetingId);
      }
    }

    dragDataRef.current = null;
    setIsDragging(false);
    setDraggingItemId(null);
    setDragOverId(null);
  }

  function cancelDrag() {
    dragDataRef.current = null;
    setIsDragging(false);
    setDraggingItemId(null);
    setDragOverId(null);
  }

  // ────────── 이동 버튼 (편집) ──────────
  async function handleMoveViaSelect(teamMemberId: string, newTeamId: string) {
    setEditingMemberId(null);
    await moveMember(teamMemberId, newTeamId, meetingId);
  }

  async function handleDeleteTeam(teamId: string, teamName: string, teamNumber: number) {
    const label = formatTeamName(teamNumber, teamName);
    if (!confirm(`"${label}"을 삭제하시겠습니까? 멤버도 미배정 상태가 됩니다.`)) return;
    const result = await deleteTeam(teamId, meetingId);
    if (!result.success) toast.error(result.error ?? '조 삭제에 실패했습니다');
  }

  function startEditTeamName(teamId: string, currentName: string) {
    setEditingTeamId(teamId);
    setEditingTeamName(currentName);
  }

  async function handleUpdateTeamName(teamId: string) {
    const result = await updateTeamName(teamId, editingTeamName, meetingId);
    if (!result.success) {
      toast.error(result.error ?? '이름 변경에 실패했습니다');
    } else {
      setEditingTeamId(null);
    }
  }

  return (
    <>
      {/* Ghost 엘리먼트 (포인터를 따라다님) */}
      {isDragging && (
        <div
          ref={ghostRef}
          className="fixed pointer-events-none z-50 bg-background border-2 border-primary px-3 py-1 text-sm font-bold shadow-lg select-none"
          style={{ left: 0, top: 0 }}
        >
          {dragLabel}
        </div>
      )}

      <div className="space-y-6">
        {/* ── 조 편성 ── */}
        <div className="card-brutal">
          <h2 className="text-lg font-black uppercase tracking-tight mb-1">조 편성</h2>
          <p className="text-sm text-muted-foreground mb-3">
            조 수를 설정합니다. 기존 조 이름은 기본값("N조")으로 초기화됩니다.
          </p>
          <div className="flex items-center gap-3">
            <select
              value={setupCount}
              onChange={(e) => setSetupCount(Number(e.target.value))}
              className="input-brutal"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}조
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleSetup}
              disabled={setupLoading}
              className="btn-brutal"
            >
              {setupLoading ? '처리 중...' : '설정'}
            </button>
          </div>
          {setupError && <p className="text-sm text-destructive font-bold mt-2">{setupError}</p>}
        </div>

        {/* ── 미배정 멤버 ── */}
        {unassignedMembers.length > 0 && (
          <div
            ref={registerDropZone('unassigned')}
            className={`card-brutal transition-colors ${
              dragOverId === 'unassigned' ? 'ring-2 ring-primary bg-muted/60' : ''
            }`}
          >
            <h2 className="text-lg font-black uppercase tracking-tight mb-3">
              미배정 멤버 ({unassignedMembers.length})
            </h2>
            <div className="space-y-2">
              {unassignedMembers.map((member) => {
                const isDraggingThis = draggingItemId === member.user_id;
                return (
                  <div
                    key={member.user_id}
                    className={`flex items-center justify-between p-2 bg-muted border-2 border-border select-none transition-opacity ${
                      teams.length > 0 ? 'touch-none cursor-grab active:cursor-grabbing' : ''
                    } ${isDraggingThis ? 'opacity-30' : 'opacity-100'}`}
                    onPointerDown={
                      teams.length > 0
                        ? (e) =>
                            startDrag(e, {
                              type: 'assign',
                              userId: member.user_id,
                              label: member.name,
                            })
                        : undefined
                    }
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={cancelDrag}
                  >
                    <span className="text-sm font-bold">
                      {member.name}
                      {member.student_id && (
                        <span className="text-muted-foreground font-mono ml-2">{member.student_id}</span>
                      )}
                    </span>
                    <div
                      className="flex items-center gap-2"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {teams.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              assignMember(e.target.value, member.user_id, meetingId);
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                          className="input-brutal text-sm"
                        >
                          <option value="" disabled>
                            조 배정
                          </option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {formatTeamName(t.team_number, t.name)}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm(`"${member.name}"을 모임에서 추방하시겠습니까?`)) return;
                          const result = await kickMember(member.user_id, meetingId);
                          if (!result.success) toast.error(result.error ?? '추방에 실패했습니다');
                        }}
                        className="btn-brutal bg-destructive text-destructive-foreground text-sm"
                      >
                        추방
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 조 목록 ── */}
        {teams.map((team) => {
          const teamLabel = formatTeamName(team.team_number, team.name);
          const otherTeams = teams.filter((t) => t.id !== team.id);
          const isEditingName = editingTeamId === team.id;

          return (
            <div
              key={team.id}
              ref={registerDropZone(team.id)}
              className={`card-brutal transition-colors ${
                dragOverId === team.id ? 'ring-2 ring-primary bg-muted/60' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3 gap-2">
                {isEditingName ? (
                  <>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="font-black text-lg shrink-0">{team.team_number}조</span>
                        <input
                          autoFocus
                          value={editingTeamName}
                          onChange={(e) => setEditingTeamName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editingTeamName.trim().length >= 2 && editingTeamName.trim().length <= 10) handleUpdateTeamName(team.id);
                            if (e.key === 'Escape') setEditingTeamId(null);
                          }}
                          maxLength={10}
                          className="input-brutal text-sm flex-1 min-w-0"
                          placeholder="조 이름 (2~10자)"
                        />
                      </div>
                      {editingTeamName.trim().length > 0 && editingTeamName.trim().length < 2 && (
                        <p className="text-xs text-destructive font-bold">2자 이상 입력해주세요</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateTeamName(team.id)}
                        disabled={editingTeamName.trim().length < 2 || editingTeamName.trim().length > 10}
                        className="btn-brutal text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTeamId(null)}
                        className="btn-brutal bg-muted text-foreground text-sm"
                      >
                        취소
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-black text-lg flex-1 min-w-0 truncate">{teamLabel}</h3>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditTeamName(team.id, team.name)}
                        className="btn-brutal bg-muted text-foreground text-sm"
                      >
                        이름 수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTeam(team.id, team.name, team.team_number)}
                        className="btn-brutal bg-destructive text-destructive-foreground text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </div>

              {team.members.length === 0 ? (
                <p className="text-sm text-muted-foreground">배정된 멤버가 없습니다</p>
              ) : (
                <ul className="space-y-1">
                  {team.members.map((member) => {
                    const isDraggingThis = draggingItemId === member.team_member_id;
                    const isEditing = editingMemberId === member.team_member_id;

                    return (
                      <li
                        key={member.team_member_id}
                        className={`flex items-center justify-between p-2 bg-muted border-2 border-border select-none touch-none cursor-grab active:cursor-grabbing transition-opacity ${
                          isDraggingThis ? 'opacity-30' : 'opacity-100'
                        }`}
                        onPointerDown={(e) =>
                          startDrag(e, {
                            type: 'move',
                            teamMemberId: member.team_member_id,
                            userId: member.user_id,
                            sourceTeamId: team.id,
                            label: member.name,
                          })
                        }
                        onPointerMove={moveDrag}
                        onPointerUp={endDrag}
                        onPointerCancel={cancelDrag}
                      >
                        <span className="text-sm font-bold">
                          {member.name}
                          {member.student_id && (
                            <span className="text-muted-foreground font-mono ml-2">
                              {member.student_id}
                            </span>
                          )}
                        </span>

                        <div
                          className="flex items-center gap-3"
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          {isEditing ? (
                            <>
                              <select
                                autoFocus
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) handleMoveViaSelect(member.team_member_id, e.target.value);
                                }}
                                className="input-brutal text-sm"
                              >
                                <option value="" disabled>이동할 조</option>
                                {otherTeams.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {formatTeamName(t.team_number, t.name)}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => setEditingMemberId(null)}
                                className="text-sm text-muted-foreground font-bold hover:underline"
                              >
                                취소
                              </button>
                            </>
                          ) : (
                            <>
                              {otherTeams.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setEditingMemberId(member.team_member_id)}
                                  className="text-sm font-bold hover:underline"
                                >
                                  이동
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={async () => {
                                  const result = await removeMember(member.team_member_id, meetingId);
                                  if (!result.success) toast.error(result.error ?? '멤버 제거에 실패했습니다');
                                }}
                                className="text-sm text-destructive font-bold hover:underline"
                              >
                                제거
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
