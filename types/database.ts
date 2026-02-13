export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          student_id: string | null;
          avatar_url: string | null;
          role: 'user' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          student_id?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          student_id?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      meetings: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          period: string;
          invite_code: string;
          is_active: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          period: string;
          invite_code?: string;
          is_active?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          period?: string;
          invite_code?: string;
          is_active?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'meetings_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      teams: {
        Row: {
          id: string;
          meeting_id: string;
          name: string;
          team_number: number;
          total_points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          name: string;
          team_number: number;
          total_points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          name?: string;
          team_number?: number;
          total_points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'teams_meeting_id_fkey';
            columns: ['meeting_id'];
            isOneToOne: false;
            referencedRelation: 'meetings';
            referencedColumns: ['id'];
          },
        ];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'team_members_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      missions: {
        Row: {
          id: string;
          meeting_id: string;
          title: string;
          description: string;
          points: number;
          start_date: string;
          end_date: string;
          max_participants: number | null;
          status: 'active' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          title: string;
          description: string;
          points?: number;
          start_date: string;
          end_date: string;
          max_participants?: number | null;
          status?: 'active' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          title?: string;
          description?: string;
          points?: number;
          start_date?: string;
          end_date?: string;
          max_participants?: number | null;
          status?: 'active' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'missions_meeting_id_fkey';
            columns: ['meeting_id'];
            isOneToOne: false;
            referencedRelation: 'meetings';
            referencedColumns: ['id'];
          },
        ];
      };
      mission_submissions: {
        Row: {
          id: string;
          mission_id: string;
          team_id: string;
          submitted_by: string;
          image_url: string;
          status: 'pending' | 'approved' | 'rejected';
          points_awarded: number;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          team_id: string;
          submitted_by: string;
          image_url: string;
          status?: 'pending' | 'approved' | 'rejected';
          points_awarded?: number;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          team_id?: string;
          submitted_by?: string;
          image_url?: string;
          status?: 'pending' | 'approved' | 'rejected';
          points_awarded?: number;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mission_submissions_mission_id_fkey';
            columns: ['mission_id'];
            isOneToOne: false;
            referencedRelation: 'missions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mission_submissions_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mission_submissions_submitted_by_fkey';
            columns: ['submitted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mission_submissions_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      points: {
        Row: {
          id: string;
          team_id: string;
          mission_id: string | null;
          amount: number;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          mission_id?: string | null;
          amount: number;
          reason: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          mission_id?: string | null;
          amount?: number;
          reason?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'points_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'points_mission_id_fkey';
            columns: ['mission_id'];
            isOneToOne: false;
            referencedRelation: 'missions';
            referencedColumns: ['id'];
          },
        ];
      };
      meeting_members: {
        Row: {
          id: string;
          meeting_id: string;
          user_id: string;
          role: 'member' | 'admin';
          joined_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          user_id: string;
          role?: 'member' | 'admin';
          joined_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          user_id?: string;
          role?: 'member' | 'admin';
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'meeting_members_meeting_id_fkey';
            columns: ['meeting_id'];
            isOneToOne: false;
            referencedRelation: 'meetings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meeting_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'user' | 'admin';
      mission_status: 'active' | 'completed';
      submission_status: 'pending' | 'approved' | 'rejected';
      meeting_member_role: 'member' | 'admin';
    };
  };
}
