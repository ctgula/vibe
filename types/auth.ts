import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_guest: boolean;
  created_at: string;
  onboarding_completed: boolean;
}

// For backward compatibility
export type ProfileType = UserProfile;

export type AuthResultData = {
  data: any | null;
  error: Error | null;
  user?: UserProfile | null;
  accessToken?: string;
};

export interface ProfileUpdateResultData {
  success: boolean;
  error: string | null;
  id?: string;
  name?: string;
  updated_at?: string;
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
  signInWithMagicLink: (email: string) => Promise<AuthResultData>;
  signInWithGoogle: () => Promise<AuthResultData>;
  ensureSessionToken: () => Promise<boolean>;
  clearGuestSession: () => Promise<void>;
  signUp: (email: string, password: string, username: string, displayName?: string) => Promise<AuthResultData>;
  signIn: (email: string, password: string) => Promise<AuthResultData>;
}
