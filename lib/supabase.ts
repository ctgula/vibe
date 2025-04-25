import { createBrowserClient } from '@supabase/ssr';
import type { Database, RoomParticipant } from './database.types';

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
  name?: string | null;
  email?: string | null;
  display_name?: string | null;
  username: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at?: string | null;
  is_guest?: boolean;
  onboarding_completed?: boolean;
  preferred_genres?: string[];
  full_name?: string;
}

export interface Room {
  id: string;
  room_name: string;
  created_by: string;
  is_live: boolean;
  enable_video: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

// Re-export the Participant type
export type Participant = RoomParticipant;
