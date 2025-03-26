import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing!');
  throw new Error('Supabase environment variables are missing');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Type definitions
export interface Profile {
  id: string;
  name: string;
  full_name?: string;
  username?: string;
  is_guest?: boolean;
  created_at: string;
  avatar_url?: string;
}

export interface Room {
  id: string;
  room_name: string;
  created_by: string;
  is_live: boolean;
  enable_video: boolean;
  created_at: string;
}

export interface RoomParticipant {
  room_id: string;
  user_id: string;
  is_speaker: boolean;
  has_raised_hand: boolean;
  is_muted: boolean;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
}
