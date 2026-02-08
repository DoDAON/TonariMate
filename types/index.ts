import type { Database } from './database';

// 테이블 Row 타입 추출
export type User = Database['public']['Tables']['users']['Row'];
export type Meeting = Database['public']['Tables']['meetings']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];
export type TeamMember = Database['public']['Tables']['team_members']['Row'];
export type Mission = Database['public']['Tables']['missions']['Row'];
export type MissionSubmission = Database['public']['Tables']['mission_submissions']['Row'];
export type Points = Database['public']['Tables']['points']['Row'];
export type MeetingMember = Database['public']['Tables']['meeting_members']['Row'];

// Insert 타입
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type MeetingInsert = Database['public']['Tables']['meetings']['Insert'];
export type TeamInsert = Database['public']['Tables']['teams']['Insert'];
export type MissionInsert = Database['public']['Tables']['missions']['Insert'];
export type MissionSubmissionInsert = Database['public']['Tables']['mission_submissions']['Insert'];

// Enum 타입
export type UserRole = Database['public']['Enums']['user_role'];
export type MissionStatus = Database['public']['Enums']['mission_status'];
export type SubmissionStatus = Database['public']['Enums']['submission_status'];
export type MeetingMemberRole = Database['public']['Enums']['meeting_member_role'];

// 조합 타입 (조인 결과용)
export type TeamWithMembers = Team & {
  members: (TeamMember & { user: User })[];
};

export type MissionWithSubmissions = Mission & {
  submissions: MissionSubmission[];
};

export type MeetingWithTeams = Meeting & {
  teams: Team[];
};

export { type Database } from './database';
