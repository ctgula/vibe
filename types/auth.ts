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

export interface AuthResultData<T = any> {
  data: T | null;
  error: Error | null;
}

export interface ProfileUpdateResultData {
  success: boolean;
  error: string | null;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  authLoading: boolean;
  guestId: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  signOut: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<ProfileUpdateResultData>;
  createGuestSession: () => Promise<string | null>;
  signInWithMagicLink: (email: string) => Promise<AuthResultData<any>>;
  signInWithGoogle: () => Promise<AuthResultData<any>>;
  ensureSessionToken: () => Promise<boolean>;
  clearGuestSession: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<AuthResultData<any>>;
  signIn: (email: string, password: string) => Promise<AuthResultData<any>>;
}
