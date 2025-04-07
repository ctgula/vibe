import { createBrowserClient } from '@supabase/ssr';
import type { Database, Participant } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing!');
  throw new Error('Supabase environment variables are missing');
}

// Custom storage object that uses cookies
const cookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null
    const item = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${key}=`))
    return item ? item.split('=')[1] : null
  },
  setItem: (key: string, value: string) => {
    if (typeof document !== 'undefined') {
      document.cookie = `${key}=${value}; path=/; max-age=2592000; SameSite=Lax` // 30 days
    }
  },
  removeItem: (key: string) => {
    if (typeof document !== 'undefined') {
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
  }
}

// Use createBrowserClient for client-side interactions
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storage: cookieStorage
    }
  }
)

// Type definitions
export interface Profile {
  id: string;
  name: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
  is_guest?: boolean;
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

// Re-export the Participant type
export type { Participant };
