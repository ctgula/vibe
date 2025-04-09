import { User } from '@supabase/supabase-js';

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
