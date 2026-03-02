'use client';

import { useState } from 'react';
import { setupTeams, deleteTeam, assignMember, removeMember, moveMember } from '@/lib/actions/admin-teams';
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
}

export function TeamManagement({ meetingId, teams, unassignedMembers }: TeamManagementProps) {
  const [setupCount, setSetupCount] = useState(teams.length || 4);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');

  const [dragOverId, setDragOverId] = useState<string | null>(null); // team.id or 'unassigned'
  const [draggingMemberId, setDraggingMemberId] = useState<string | null>(null);

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null); // teamMemberId for inline move

  // ────────── 조 편성 ──────────
  async function handleSetup() {
    // 줄이는 경우 멤버 경고
    const teamsToRemove = teams.filter((t) => t.team_number > setupCount);
    const hasMembersInRemoved = teamsToRemove.some((t) => t.members.length > 0);

    if (hasMembersInRemoved) {
      const names = teamsToRemove
        .filter((t) => t.members.length > 0)
        .map((t) => `${t.team_number}조`)
        .join(', ');
      if (
        !confirm(
          `${names}에 멤버가 있습니다. 해당 멤버는 미배정 상태가 됩니다.\n계속하시겠습니까?`
        )
      )
        return;
    }

    setSetupLoading(true);
    setSetupError('');
    const result = await setupTeams(meetingId, setupCount);
    setSetupLoading(false);
    if (!result.success) {
      setSetupError(result.error ?? '오류가 발생했습니다');
    }
  }

  // ────────── DnD 헬퍼 ──────────
  function handleDragStart(e: React.DragEvent, data: DragData) {
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingMemberId(data.teamMemberId ?? data.userId);
  }

  function handleDragEnd() {
    setDraggingMemberId(null);
    setDragOverId(null);
  }

  function handleDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(targetId);
  }

  async function handleDropOnTeam(e: React.DragEvent, targetTeamId: string) {
    e.preventDefault();
    setDragOverId(null);
    setDraggingMemberId(null);

    let data: DragData;
    try {
      data = JSON.parse(e.dataTransfer.getData('application/json')) as DragData;
    } catch {
      return;
    }

    if (data.type === 'move' && data.teamMemberId) {
      if (data.sourceTeamId === targetTeamId) return; // 같은 조
      await moveMember(data.teamMemberId, targetTeamId, meetingId);
    } else if (data.type === 'assign') {
      await assignMember(targetTeamId, data.userId, meetingId);
    }
  }

  async function handleDropOnUnassigned(e: React.DragEvent) {
    e.preventDefault();
    setDragOverId(null);
    setDraggingMemberId(null);

    let data: DragData;
    try {
      data = JSON.parse(e.dataTransfer.getData('application/json')) as DragData;
    } catch {
      return;
    }

    if (data.type === 'move' && data.teamMemberId) {
      await removeMember(data.teamMemberId, meetingId);
    }
  }

  // ────────── 멤버 이동 (편집 버튼) ──────────
  async function handleMoveViaSelect(teamMemberId: string, newTeamId: string) {
    setEditingMemberId(null);
    await moveMember(teamMemberId, newTeamId, meetingId);
  }

  async function handleDeleteTeam(teamId: string, teamName: string) {
    if (!confirm(`"${teamName}"을 삭제하시겠습니까? 멤버도 미배정 상태가 됩니다.`)) return;
    const result = await deleteTeam(teamId, meetingId);
    if (!result.success) alert(result.error);
  }

  async function handleAssignFromSelect(teamId: string, userId: string) {
    await assignMember(teamId, userId, meetingId);
  }

  return (
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

      {/* ── 미배정 멤버 (드롭존) ── */}
      {unassignedMembers.length > 0 && (
        <div
          onDragOver={(e) => handleDragOver(e, 'unassigned')}
          onDragLeave={() => setDragOverId(null)}
          onDrop={handleDropOnUnassigned}
          className={`card-brutal transition-colors ${dragOverId === 'unassigned' ? 'bg-muted/80 border-dashed' : ''}`}
        >
          <h2 className="text-lg font-black uppercase tracking-tight mb-3">
            미배정 멤버 ({unassignedMembers.length})
          </h2>
          <div className="space-y-2">
            {unassignedMembers.map((member) => (
              <div
                key={member.user_id}
                draggable={teams.length > 0}
                onDragStart={(e) =>
                  handleDragStart(e, { type: 'assign', userId: member.user_id })
                }
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between p-2 bg-muted border-2 border-border ${teams.length > 0 ? 'cursor-grab active:cursor-grabbing' : ''}`}
              >
                <span className="text-sm font-bold">
                  {member.name}
                  {member.student_id && (
                    <span className="text-muted-foreground font-mono ml-2">
                      {member.student_id}
                    </span>
                  )}
                </span>
                {teams.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignFromSelect(e.target.value, member.user_id);
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
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 조 목록 ── */}
      {teams.map((team) => (
        <div
          key={team.id}
          onDragOver={(e) => handleDragOver(e, team.id)}
          onDragLeave={() => setDragOverId(null)}
          onDrop={(e) => handleDropOnTeam(e, team.id)}
          className={`card-brutal transition-colors ${dragOverId === team.id ? 'bg-muted/60 border-dashed' : ''}`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-lg">{team.name}</h3>
            <button
              type="button"
              onClick={() => handleDeleteTeam(team.id, team.name)}
              className="btn-brutal bg-destructive text-destructive-foreground text-sm"
            >
              삭제
            </button>
          </div>

          {team.members.length === 0 ? (
            <p className="text-sm text-muted-foreground">배정된 멤버가 없습니다</p>
          ) : (
            <ul className="space-y-1">
              {team.members.map((member) => {
                const isEditing = editingMemberId === member.team_member_id;
                const otherTeams = teams.filter((t) => t.id !== team.id);
                const isDragging = draggingMemberId === member.team_member_id;

                return (
                  <li
                    key={member.team_member_id}
                    draggable={true}
                    onDragStart={(e) =>
                      handleDragStart(e, {
                        type: 'move',
                        teamMemberId: member.team_member_id,
                        userId: member.user_id,
                        sourceTeamId: team.id,
                      })
                    }
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between p-2 bg-muted border-2 border-border cursor-grab active:cursor-grabbing transition-opacity ${isDragging ? 'opacity-40' : 'opacity-100'}`}
                  >
                    <span className="text-sm font-bold">
                      {member.name}
                      {member.student_id && (
                        <span className="text-muted-foreground font-mono ml-2">
                          {member.student_id}
                        </span>
                      )}
                    </span>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <select
                            autoFocus
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleMoveViaSelect(member.team_member_id, e.target.value);
                              }
                            }}
                            className="input-brutal text-sm"
                          >
                            <option value="" disabled>
                              이동할 조
                            </option>
                            {otherTeams.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
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
                            onClick={() => removeMember(member.team_member_id, meetingId)}
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
      ))}
    </div>
  );
}
