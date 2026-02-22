'use client';

import { useState } from 'react';
import { createTeam, deleteTeam, assignMember, removeMember } from '@/lib/actions/admin-teams';
import type { AdminTeam } from '@/lib/queries/admin-teams';
import type { UnassignedMember } from '@/lib/queries/admin-teams';

interface TeamManagementProps {
  meetingId: string;
  teams: AdminTeam[];
  unassignedMembers: UnassignedMember[];
}

export function TeamManagement({ meetingId, teams, unassignedMembers }: TeamManagementProps) {
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamNumber, setNewTeamNumber] = useState(
    teams.length > 0 ? Math.max(...teams.map((t) => t.team_number)) + 1 : 1
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreateTeam() {
    if (!newTeamName.trim()) return;
    setLoading(true);
    setError('');
    const result = await createTeam(meetingId, newTeamName, newTeamNumber);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? '오류가 발생했습니다');
    } else {
      setNewTeamName('');
      setNewTeamNumber((prev) => prev + 1);
    }
  }

  async function handleDeleteTeam(teamId: string, teamName: string) {
    if (!confirm(`"${teamName}" 팀을 삭제하시겠습니까? 팀 멤버도 모두 해제됩니다.`)) return;
    await deleteTeam(teamId, meetingId);
  }

  async function handleAssignMember(teamId: string, userId: string) {
    await assignMember(teamId, userId, meetingId);
  }

  async function handleRemoveMember(teamMemberId: string) {
    await removeMember(teamMemberId, meetingId);
  }

  return (
    <div className="space-y-6">
      {/* 팀 생성 */}
      <div className="card-brutal">
        <h2 className="text-lg font-black uppercase tracking-tight mb-3">팀 생성</h2>
        <div className="flex gap-3 items-end">
          <div>
            <label htmlFor="team-number" className="block text-sm font-bold mb-1">번호</label>
            <input
              id="team-number"
              type="number"
              min={1}
              value={newTeamNumber}
              onChange={(e) => setNewTeamNumber(Number(e.target.value))}
              className="input-brutal w-20"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="team-name" className="block text-sm font-bold mb-1">이름</label>
            <input
              id="team-name"
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="input-brutal w-full"
              placeholder="팀 이름"
            />
          </div>
          <button
            type="button"
            onClick={handleCreateTeam}
            disabled={loading || !newTeamName.trim()}
            className="btn-brutal"
          >
            {loading ? '...' : '생성'}
          </button>
        </div>
        {error && <p className="text-sm text-destructive font-bold mt-2">{error}</p>}
      </div>

      {/* 미배정 멤버 */}
      {unassignedMembers.length > 0 && (
        <div className="card-brutal">
          <h2 className="text-lg font-black uppercase tracking-tight mb-3">
            미배정 멤버 ({unassignedMembers.length})
          </h2>
          <div className="space-y-2">
            {unassignedMembers.map((member) => (
              <div key={member.user_id} className="flex items-center justify-between p-2 bg-muted border-2 border-border">
                <span className="text-sm font-bold">
                  {member.name}
                  {member.student_id && (
                    <span className="text-muted-foreground font-mono ml-2">{member.student_id}</span>
                  )}
                </span>
                {teams.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignMember(e.target.value, member.user_id);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="input-brutal text-sm"
                  >
                    <option value="" disabled>배정할 팀</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.team_number}조 {t.name}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 팀 목록 */}
      {teams.map((team) => (
        <div key={team.id} className="card-brutal">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-lg">
              {team.team_number}조 — {team.name}
            </h3>
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
              {team.members.map((member) => (
                <li key={member.team_member_id} className="flex items-center justify-between p-2 bg-muted border-2 border-border">
                  <span className="text-sm font-bold">
                    {member.name}
                    {member.student_id && (
                      <span className="text-muted-foreground font-mono ml-2">{member.student_id}</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.team_member_id)}
                    className="text-sm text-destructive font-bold hover:underline"
                  >
                    제거
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
