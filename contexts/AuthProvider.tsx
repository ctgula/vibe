'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { 
  AuthContextType, 
  UserProfile, 
  AuthResultData, 
  ProfileUpdateResultData 
} from '@/types/auth';

// Create a default context with all properties to avoid undefined errors
const defaultContextValue: AuthContextType = {
  user: null,
  profile: null,
  guestId: null,
  isLoading: true,
  authLoading: true,
  isAuthenticated: false,
  isGuest: false,
  createGuestSession: async () => null,
  signInWithMagicLink: async (email: string) => ({ data: null, error: null }),
  signInWithGoogle: async () => ({ data: null, error: null }),
  signOut: async () => {},
  updateProfile: async (updates: Partial<UserProfile>) => ({ success: false, error: null }),
  ensureSessionToken: async () => false,
  clearGuestSession: async () => {},
  signUp: async (email: string, password: string) => ({ data: null, error: null }),
  signIn: async (email: string, password: string) => ({ data: null, error: null })
};

// Create the AuthContext with the default value
const AuthContext = createContext<AuthContextType>(defaultContextValue);

/**
 * Custom hook to use the auth context
 * @returns The auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * AuthProvider component that provides authentication functionality
 * @param children - React children
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const router = useRouter();
  
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [supabase, setSupabase] = useState<any>(null);

  // Flag to indicate client-side rendering
  useEffect(() => {
    setIsClient(true);
    
    // Initialize Supabase client on the client side
    if (typeof window !== 'undefined') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      const supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
      setSupabase(supabaseClient);
      
      // Immediately check for guest session
      const guestProfileId = localStorage.getItem('guestProfileId');
      if (guestProfileId) {
        console.log("Found guest profile ID in localStorage:", guestProfileId);
        setGuestId(guestProfileId);
        setIsGuest(true);
      }
      
      // Set loading state to false after a short delay if auth is taking too long
      const timeoutId = setTimeout(() => {
        if (authLoading) {
          console.log("Auth loading timeout - forcing completion");
          setAuthLoading(false);
        }
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, []);

  // Set up Supabase auth listener
  useEffect(() => {
    if (!isClient || !supabase) return;
    
    const getUser = async () => {
      try {
        console.log("Checking for existing session...");
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setAuthLoading(false);
          return;
        }

        const session = data.session;
        
        if (session) {
          console.log("Found existing session for user:", session.user.email);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log("No existing session found");
          setAuthLoading(false);
        }
      } catch (error) {
        console.error('Error in getUser:', error);
        setAuthLoading(false);
      }
    };

    getUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        console.log("Auth state change:", event);
        if (session) {
          setUser(session.user);
          
          // Fetch profile and create if needed
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setAuthLoading(false);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [isClient, supabase]);

  /**
   * Fetch user profile from the database
   * @param userId - The user ID to fetch the profile for
   */
  const fetchProfile = async (userId: string) => {
    if (!supabase) return;
    
    try {
      console.log("Fetching profile for user:", userId);
      
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching profile:', fetchError);
        setAuthLoading(false);
        return;
      }
      
      if (existingProfile) {
        console.log("Found existing profile:", existingProfile.username);
        setProfile(existingProfile);
        setIsGuest(!!existingProfile.is_guest);
        setAuthLoading(false);
        return;
      }
      
      console.log("No profile found, creating new profile");
      
      // Create new profile if it doesn't exist
      // Ensure all REQUIRED fields from the 'profiles' table 'Insert' type are present
      const newProfileData = {
        id: userId,
        email: user?.email, // Added required email field
        display_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'New User',
        avatar_url: user?.user_metadata?.avatar_url || null, // Ensure null if empty
        is_guest: false,
        onboarding_completed: false // Added missing field, assuming default is false
        // created_at is handled by the database default
        // Removed fields not in schema: username, bio, theme_color, updated_at
      };

      // Type assertion to ensure compatibility if UserProfile type is different
      const newProfile: UserProfile = newProfileData as UserProfile;
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([newProfileData]); // Use the cleaned-up data object
      
      if (insertError) {
        console.error('Error creating profile:', insertError);
        setAuthLoading(false);
        return;
      }
      
      setProfile(newProfile);
      setAuthLoading(false);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setAuthLoading(false);
    }
  };

  /**
   * Create a guest session
   * @param username - The username for the guest session
   * @returns The guest profile ID or null if failed
   */
  const createGuestSession = async (username?: string): Promise<string | null> => {
    if (!isClient || !supabase) return null;
    
    try {
      setAuthLoading(true);
      
      // Generate a unique ID for the guest
      const guestProfileId = uuidv4();
      
      // Create a guest profile in the database
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: guestProfileId,
          username: username || `guest_${Math.floor(Math.random() * 10000)}`,
          display_name: username || `Guest ${Math.floor(Math.random() * 10000)}`,
          is_guest: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        toast({
          title: 'Error creating guest session',
          description: error.message,
          variant: 'destructive'
        });
        return null;
      }
      
      // Store the guest ID in localStorage
      localStorage.setItem('guestProfileId', guestProfileId);
      
      // Update state
      setGuestId(guestProfileId);
      setIsGuest(true);
      
      toast({
        title: 'Guest session created',
        description: 'You are now browsing as a guest'
      });
      
      return guestProfileId;
    } catch (error) {
      console.error('Error creating guest session:', error);
      toast({
        title: 'Error creating guest session',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      return null;
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Clear guest session
   */
  const clearGuestSession = async (): Promise<void> => {
    if (!isClient) return;
    
    localStorage.removeItem('guestProfileId');
    setGuestId(null);
    setIsGuest(false);
  };

  /**
   * Sign up with email and password
   * @param email - The email to sign up with
   * @param password - The password to sign up with
   * @returns Auth result with data and error
   */
  const signUp = async (email: string, password: string): Promise<AuthResultData> => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Error signing up:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return { data: null, error };
      }

      toast({
        title: "Success",
        description: "Check your email for the confirmation link.",
        variant: "default"
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error in signUp:', error);
      const errorObj = error instanceof Error ? error : new Error('Unknown error during sign up');
      toast({
        title: "Error",
        description: "Could not sign up. Please try again.",
        variant: "destructive"
      });
      return { data: null, error: errorObj };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with email and password
   * @param email - The email to sign in with
   * @param password - The password to sign in with
   * @returns Auth result with data and error
   */
  const signIn = async (email: string, password: string): Promise<AuthResultData> => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Error signing in:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return { data: null, error };
      }

      // Clear any guest session when signing in with a real account
      await clearGuestSession();

      return { data, error: null };
    } catch (error) {
      console.error('Error in signIn:', error);
      const errorObj = error instanceof Error ? error : new Error('Unknown error during sign in');
      toast({
        title: "Error",
        description: "Could not sign in. Please try again.",
        variant: "destructive"
      });
      return { data: null, error: errorObj };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with magic link
   * @param email - The email to send the magic link to
   * @returns Auth result with data and error
   */
  const signInWithMagicLink = async (email: string): Promise<AuthResultData> => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Error signing in with magic link:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return { data: null, error };
      }

      toast({
        title: "Success",
        description: "Check your email for the magic link.",
        variant: "default"
      });

      // Clear any guest session when signing in with a real account
      await clearGuestSession();

      return { data, error: null };
    } catch (error) {
      console.error('Error in signInWithMagicLink:', error);
      const errorObj = error instanceof Error ? error : new Error('Unknown error during magic link sign in');
      toast({
        title: "Error",
        description: "Could not send magic link. Please try again.",
        variant: "destructive"
      });
      return { data: null, error: errorObj };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with Google
   * @returns Auth result with data and error
   */
  const signInWithGoogle = async (): Promise<AuthResultData> => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Error signing in with Google:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return { data: null, error };
      }

      // Clear any guest session when signing in with a real account
      await clearGuestSession();

      return { data, error: null };
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
      const errorObj = error instanceof Error ? error : new Error('Unknown error during Google sign in');
      toast({
        title: "Error",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive"
      });
      return { data: null, error: errorObj };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    if (!supabase) return;
    
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        // Clear guest session if it exists
        await clearGuestSession();
        
        // Redirect to home page
        router.push('/');
      }
    } catch (error) {
      console.error('Error in signOut:', error);
      toast({
        title: "Error",
        description: "Could not sign out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update user profile
   * @param updates - Partial profile data to update
   * @returns Profile update result with success and error
   */
  const updateProfile = async (updates: Partial<UserProfile>): Promise<ProfileUpdateResultData> => {
    if (!supabase) return { success: false, error: "Supabase client not initialized" };
    
    const profileId = user?.id || guestId;
    if (!profileId) return { success: false, error: "No authenticated user or guest" };
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return { success: false, error: error.message };
      }

      // Refetch the profile to get the updated data
      await fetchProfile(profileId);

      toast({
        title: "Success",
        description: "Profile updated successfully.",
        variant: "default"
      });

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in updateProfile:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: "Could not update profile. Please try again.",
        variant: "destructive"
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Ensure session token for API requests
   * @returns Boolean indicating if a valid session exists
   */
  const ensureSessionToken = async (): Promise<boolean> => {
    if (!supabase) return false;
    
    try {
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    } catch (error) {
      console.error('Error in ensureSessionToken:', error);
      return false;
    }
  };

  // Derived state
  const isAuthenticated = !!user;

  // Only render children when on the client side
  if (!isClient) {
    return null;
  }

  // Create context value
  const contextValue: AuthContextType = {
    user,
    profile,
    guestId,
    isLoading,
    authLoading,
    isAuthenticated,
    isGuest,
    createGuestSession,
    signInWithMagicLink,
    signInWithGoogle,
    signOut,
    updateProfile,
    ensureSessionToken,
    clearGuestSession,
    signUp,
    signIn
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
