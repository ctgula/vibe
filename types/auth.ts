import { User } from '@supabase/supabase-js';

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

// For backward compatibility
export type ProfileType = UserProfile;

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  authLoading: boolean;
  guestId: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  signOut: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<{ success: boolean; error: string | null }>;
  createGuestSession: () => Promise<string | null>;
  signInWithMagicLink: (email: string) => Promise<{ data: any | null; error: any | null }>;
  signInWithGoogle: () => Promise<{ data: any | null; error: any | null }>;
  ensureSessionToken: () => Promise<boolean>;
  clearGuestSession: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ data: any | null; error: any | null }>;
  signIn: (email: string, password: string) => Promise<{ data: any | null; error: any | null }>;
}
