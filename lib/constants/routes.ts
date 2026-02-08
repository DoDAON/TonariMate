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
  ADMIN_MEETING_EDIT: (id: string) => `/admin/meetings/${id}/edit`,
  ADMIN_MEETING: (id: string) => `/admin/meetings/${id}`,

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
