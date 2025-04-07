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
      profiles: {
        Row: {
          id: string
          username: string
          name: string | null
          avatar_url: string | null
          bio: string | null
          is_guest: boolean
          created_at: string
          updated_at: string | null
          display_name: string | null
          email: string | null
        }
        Insert: {
          id: string
          username: string
          name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_guest?: boolean
          created_at?: string
          updated_at?: string | null
          display_name?: string | null
          email?: string | null
        }
        Update: {
          id?: string
          username?: string
          name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_guest?: boolean
          created_at?: string
          updated_at?: string | null
          display_name?: string | null
          email?: string | null
        }
      }
      rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string | null
          created_by_guest: string | null
          is_active: boolean
          is_public: boolean
          tags: string[] | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by?: string | null
          created_by_guest?: string | null
          is_active?: boolean
          is_public?: boolean
          tags?: string[] | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string | null
          created_by_guest?: string | null
          is_active?: boolean
          is_public?: boolean
          tags?: string[] | null
          created_at?: string
          updated_at?: string | null
        }
      }
      room_participants: {
        Row: {
          id: string
          room_id: string
          user_id: string | null
          guest_id: string | null
          is_speaker: boolean
          is_host: boolean
          is_muted: boolean
          has_raised_hand: boolean
          joined_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          room_id: string
          user_id?: string | null
          guest_id?: string | null
          is_speaker?: boolean
          is_host?: boolean
          is_muted?: boolean
          has_raised_hand?: boolean
          joined_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string | null
          guest_id?: string | null
          is_speaker?: boolean
          is_host?: boolean
          is_muted?: boolean
          has_raised_hand?: boolean
          joined_at?: string
          is_active?: boolean
        }
      }
      room_messages: {
        Row: {
          id: string
          room_id: string
          user_id: string | null
          guest_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id?: string | null
          guest_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string | null
          guest_id?: string | null
          content?: string
          created_at?: string
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

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Room = Database['public']['Tables']['rooms']['Row']
export type RoomParticipant = Database['public']['Tables']['room_participants']['Row']
export type RoomMessage = Database['public']['Tables']['room_messages']['Row']
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']