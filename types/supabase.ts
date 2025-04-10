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
      rooms: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          host_id: string
          is_private: boolean
          last_active_at: string | null
          has_camera: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          host_id: string
          is_private?: boolean
          last_active_at?: string | null
          has_camera?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          host_id?: string
          is_private?: boolean
          last_active_at?: string | null
          has_camera?: boolean
        }
      }
      room_participants: {
        Row: {
          id: string
          room_id: string
          user_id: string
          is_speaker: boolean
          is_muted: boolean
          has_raised_hand: boolean
          joined_at: string
          is_host: boolean
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          is_speaker?: boolean
          is_muted?: boolean
          has_raised_hand?: boolean
          joined_at?: string
          is_host?: boolean
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          is_speaker?: boolean
          is_muted?: boolean
          has_raised_hand?: boolean
          joined_at?: string
          is_host?: boolean
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
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
