export const ROUTES = {
  HOME: '/',
  MY: '/my',

  // 모임 관련
  MEETING: (id: string) => `/meetings/${id}`,
  TEAM: (meetingId: string, teamId: string) => `/meetings/${meetingId}/teams/${teamId}`,
  MISSION: (meetingId: string, missionId: string) => `/meetings/${meetingId}/missions/${missionId}`,

  // 관리자
  ADMIN: '/admin',
  ADMIN_MEETING_NEW: '/admin/meetings/new',
  ADMIN_MEETING: (id: string) => `/admin/meetings/${id}`,
  ADMIN_MEETING_EDIT: (id: string) => `/admin/meetings/${id}/edit`,
  ADMIN_MEETING_TEAMS: (id: string) => `/admin/meetings/${id}/teams`,
  ADMIN_MEETING_MISSIONS: (id: string) => `/admin/meetings/${id}/missions`,
  ADMIN_MEETING_MISSION_NEW: (id: string) => `/admin/meetings/${id}/missions/new`,
  ADMIN_MEETING_MISSION: (id: string, missionId: string) => `/admin/meetings/${id}/missions/${missionId}`,
  ADMIN_MEETING_MISSION_EDIT: (id: string, missionId: string) => `/admin/meetings/${id}/missions/${missionId}/edit`,
  ADMIN_MEETING_SUBMISSIONS: (id: string) => `/admin/meetings/${id}/submissions`,

  // 인증
  LOGIN: '/login',
  SIGNUP: '/signup',
  CALLBACK: '/auth/callback',

  // API
  API: {
    AUTH: '/api/auth',
    USERS: '/api/users',
    MEETINGS: '/api/meetings',
    TEAMS: '/api/teams',
    MISSIONS: '/api/missions',
  },
} as const;
