CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_private BOOLEAN DEFAULT FALSE,
  max_participants INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Rooms are viewable by everyone"
  ON rooms FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Room creators can update their rooms"
  ON rooms FOR UPDATE
  USING (auth.uid() = creator_id);-- Add indexes to improve query performance
  CREATE INDEX idx_room_participants_room_id ON room_participants(room_id);
  CREATE INDEX idx_room_participants_profile_id ON room_participants(profile_id);
  CREATE INDEX idx_notifications_profile_id ON notifications(profile_id);
  CREATE INDEX idx_activity_logs_room_id ON activity_logs(room_id);
  CREATE INDEX idx_files_room_id ON files(room_id);
  CREATE INDEX idx_poll_votes_poll_id ON poll_votes(poll_id);import { User } from '@supabase/supabase-js';

/**
 * User profile interface representing a user in the profiles table
 */
export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_guest: boolean;
  bio: string | null;
  theme_color: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Authentication result interface for methods that return data and error
 */
export interface AuthResultData<T = any> {
  data: T | null;
  error: Error | null;
}

/**
 * Profile update result interface
 */
export interface ProfileUpdateResultData {
  success: boolean;
  error: string | null;
}

/**
 * Authentication context interface defining all available auth methods and state
 */
export interface AuthContextType {
  // User state
  user: User | null;
  profile: UserProfile | null;
  guestId: string | null;
  
  // Loading and auth states
  isLoading: boolean;
  authLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  
  // Authentication methods
  signUp: (email: string, password: string) => Promise<AuthResultData>;
  signIn: (email: string, password: string) => Promise<AuthResultData>;
  signInWithMagicLink: (email: string) => Promise<AuthResultData>;
  signInWithGoogle: () => Promise<AuthResultData>;
  signOut: () => Promise<void>;
  
  // Profile and session management
  updateProfile: (profileData: Partial<UserProfile>) => Promise<ProfileUpdateResultData>;
  ensureSessionToken: () => Promise<boolean>;
  
  // Guest session management
  createGuestSession: () => Promise<string | null>;
  clearGuestSession: () => Promise<void>;
}

// For backward compatibility
export type ProfileType = UserProfile;
