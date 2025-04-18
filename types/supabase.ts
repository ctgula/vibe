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
          email: string
          display_name: string | null
          is_guest: boolean
          created_at: string
          avatar_url: string | null
          onboarding_completed: boolean
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          is_guest?: boolean
          created_at?: string
          avatar_url?: string | null
          onboarding_completed?: boolean
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          is_guest?: boolean
          created_at?: string
          avatar_url?: string | null
          onboarding_completed?: boolean
        }
      }
      rooms: {
        Row: {
          id: string
          name: string
          created_by: string
          is_active: boolean
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          is_active?: boolean
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          is_active?: boolean
          is_public?: boolean
          created_at?: string
        }
      }
      room_participants: {
        Row: {
          id: string
          room_id: string
          user_id: string | null
          guest_id: string | null
          is_speaker: boolean
          is_muted: boolean
          has_raised_hand: boolean
          joined_at: string
          is_active: boolean
          is_host: boolean
        }
        Insert: {
          id?: string
          room_id: string
          user_id?: string | null
          guest_id?: string | null
          is_speaker?: boolean
          is_muted?: boolean
          has_raised_hand?: boolean
          joined_at?: string
          is_active?: boolean
          is_host?: boolean
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string | null
          guest_id?: string | null
          is_speaker?: boolean
          is_muted?: boolean
          has_raised_hand?: boolean
          joined_at?: string
          is_active?: boolean
          is_host?: boolean
        }
      }
    }
  }
}