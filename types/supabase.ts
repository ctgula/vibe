export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      messages: {
        Row: {
          id: string
          created_at: string
          content: string
          room_id: string
          profile_id: string
          is_system: boolean | null
        }
        Insert: {
          id?: string
          created_at?: string
          content: string
          room_id: string
          profile_id: string
          is_system?: boolean | null
        }
        Update: {
          id?: string
          created_at?: string
          content?: string
          room_id?: string
          profile_id?: string
          is_system?: boolean | null
        }
      }
      room_messages: {
        Row: {
          id: string
          created_at: string
          content: string
          room_id: string
          user_id: string | null
          guest_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          content: string
          room_id: string
          user_id?: string | null
          guest_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          content?: string
          room_id?: string
          user_id?: string | null
          guest_id?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          created_at: string
          profile_id: string
          title: string
          body: string
          type: string
          data: Json | null
          read: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          profile_id: string
          title: string
          body: string
          type: string
          data?: Json | null
          read?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          profile_id?: string
          title?: string
          body?: string
          type?: string
          data?: Json | null
          read?: boolean
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          username: string | null
          name: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          is_guest: boolean
          email: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string | null
          username?: string | null
          name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_guest?: boolean
          email?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          username?: string | null
          name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_guest?: boolean
          email?: string | null
        }
      }
      room_participants: {
        Row: {
          id: string
          created_at: string
          room_id: string
          profile_id: string
          user_id: string | null
          guest_id: string | null
          is_speaker: boolean
          is_moderator: boolean
          has_raised_hand: boolean
          is_muted: boolean
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          room_id: string
          profile_id: string
          user_id?: string | null
          guest_id?: string | null
          is_speaker?: boolean
          is_moderator?: boolean
          has_raised_hand?: boolean
          is_muted?: boolean
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          room_id?: string
          profile_id?: string
          user_id?: string | null
          guest_id?: string | null
          is_speaker?: boolean
          is_moderator?: boolean
          has_raised_hand?: boolean
          is_muted?: boolean
          is_active?: boolean
        }
      }
      rooms: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          is_private: boolean
          created_by: string
          is_active: boolean
          last_active_at: string | null
          has_camera: boolean | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          is_private?: boolean
          created_by: string
          is_active?: boolean
          last_active_at?: string | null
          has_camera?: boolean | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          is_private?: boolean
          created_by?: string
          is_active?: boolean
          last_active_at?: string | null
          has_camera?: boolean | null
        }
      }
      subscription_tokens: {
        Row: {
          id: string
          created_at: string
          profile_id: string
          token: string
          endpoint: string
        }
        Insert: {
          id?: string
          created_at?: string
          profile_id: string
          token: string
          endpoint: string
        }
        Update: {
          id?: string
          created_at?: string
          profile_id?: string
          token?: string
          endpoint?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          room_id: string | null
          user_id: string | null
          guest_id: string | null
          action: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          room_id?: string | null
          user_id?: string | null
          guest_id?: string | null
          action: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string | null
          user_id?: string | null
          guest_id?: string | null
          action?: string
          details?: Json | null
          created_at?: string
        }
      }
      room_analytics: {
        Row: {
          id: string
          room_id: string
          message_count: number
          participant_count: number
          active_participant_count: number
          last_active_at: string | null
          is_trending: boolean
          trending_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          message_count: number
          participant_count: number
          active_participant_count: number
          last_active_at?: string | null
          is_trending?: boolean
          trending_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          message_count?: number
          participant_count?: number
          active_participant_count?: number
          last_active_at?: string | null
          is_trending?: boolean
          trending_score?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]

export type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TableUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']