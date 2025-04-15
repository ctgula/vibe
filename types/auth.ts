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
  name?: string; // Added for backward compatibility
}

// For backward compatibility
export type ProfileType = UserProfile;

export interface AuthResultData<T = any> {
  data: T | null;
  error: Error | null;
  access_token?: string;
  user?: UserProfile;
  id?: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  is_guest?: boolean;
}

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
  signInWithMagicLink: (email: string) => Promise<AuthResultData<any>>;
  signInWithGoogle: () => Promise<AuthResultData<any>>;
  ensureSessionToken: () => Promise<boolean>;
  clearGuestSession: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<AuthResultData<any>>;
  signIn: (email: string, password: string) => Promise<AuthResultData<any>>;
}
