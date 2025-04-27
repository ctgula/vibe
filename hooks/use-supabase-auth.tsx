'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient, Session } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import type { Provider } from '@supabase/supabase-js'; 
import type { Route } from 'next'; 
import { AuthResponse } from '@supabase/supabase-js'; 

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  is_guest?: boolean;
  username?: string;
  display_name?: string;
}

interface AuthContextType {
  user: any;
  profile: Profile | null;
  guestId: string | null;
  isLoading: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signInWithOAuth: (provider: Provider) => Promise<void>; 
  signOut: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  clearGuestSession: () => Promise<void>; 
  createEmptyProfile: (userId: string) => Promise<void>;
  ensureSessionToken: () => Promise<string | null>;
}

// Default context values for SSR to prevent hydration errors
const defaultContextValue: AuthContextType = {
  user: null,
  profile: null,
  guestId: null,
  isLoading: true,
  isGuest: false,
  isAuthenticated: false,
  authLoading: true,
  signIn: async () => { throw new Error('Not implemented') },
  signUp: async () => { throw new Error('Not implemented') },
  signInWithOAuth: async () => { throw new Error('Not implemented') },
  signOut: async () => { throw new Error('Not implemented') },
  setProfile: () => {},
  clearGuestSession: async () => {},
  createEmptyProfile: async () => {},
  ensureSessionToken: async () => null
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set isClient flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Clear guest session helper
  const clearGuestSession = async () => {
    if (isClient) {
      localStorage.removeItem('guestProfileId');
      localStorage.removeItem('guest_id'); // Clear legacy key too
    }
    setGuestId(null);
  };

  // Create an empty profile for a user
  const createEmptyProfile = async (userId: string): Promise<void> => {
    try {
      console.log('Creating empty profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: `user_${Date.now().toString(36)}`, // Generate a temporary username
          display_name: 'New User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_guest: false,
          onboarding_completed: false
        });

      if (error) {
        console.error('Error creating empty profile:', error);
        throw error;
      }
      
      console.log('Empty profile created successfully');
    } catch (err) {
      console.error('Exception creating empty profile:', err);
      throw err;
    }
  };

  useEffect(() => {
    // Only run in the client
    if (!isClient) {
      console.log('AUTH STATE: Skipping auth initialization on server');
      return;
    }
    
    console.log('AUTH STATE: Starting auth initialization');
    
    // Initialize auth state
    const initializeAuth = async () => {
      console.log('AUTH STATE: Running initializeAuth');
      try {
        setIsLoading(true);
        setAuthLoading(true);
        
        // 1. First check for an active session
        console.log('AUTH STATE: Checking for active session');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('AUTH STATE: Session error:', sessionError);
          throw sessionError;
        }
        
        const session = sessionData?.session;
        
        // 2. If we have a session, get the user and profile
        if (session) {
          console.log('AUTH STATE: Session found, user:', session.user.id);
          setUser(session.user); // Set user immediately
          
          // 3. Set up auth state change listener
          console.log('AUTH STATE: Setting up auth listener');
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((event, newSession) => {
            console.log('AUTH STATE: Auth state changed:', event, newSession?.user?.id);
            
            if (event === 'SIGNED_IN' && newSession) {
              setUser(newSession.user);
              // Fetch user profile after sign-in
              fetchUserProfile(newSession.user.id);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setProfile(null);
              // Clear any stored guest session
              clearGuestSession();
            }
          });
          
          // 4. Try to fetch user profile
          console.log('AUTH STATE: Fetching user profile');
          const userProfile = await fetchUserProfile(session.user.id);
          
          // 5. Create empty profile if needed
          if (!userProfile) {
            console.log('AUTH STATE: No profile found, creating empty profile');
            await createEmptyProfile(session.user.id);
            // Refresh profile after creation
            await fetchUserProfile(session.user.id);
          }
          
          // Cleanup subscription on unmount
          return () => {
            if (isClient) {
              console.log('AUTH STATE: Cleaning up auth subscription');
              subscription.unsubscribe();
            }
          };
        } else {
          console.log('AUTH STATE: No session, checking for guest');
          setUser(null);
          
          // 6. Check for guest session
          if (isClient) {
            await checkGuestSession();
          }
        }
        
        setAuthInitialized(true);
      } catch (err) {
        console.error('AUTH STATE: Init error:', err);
      } finally {
        // Always set loading to false after initialization attempt
        console.log('AUTH STATE: Init complete, setting isLoading to false');
        setIsLoading(false);
        setAuthLoading(false);
      }
    };

    if (!authInitialized && isClient) {
      initializeAuth();
    }
    
    // Add a safety timeout to ensure isLoading is reset after a maximum time
    // This prevents the app from being stuck in a loading state
    let safetyTimeout: NodeJS.Timeout;
    if (isClient) {
      safetyTimeout = setTimeout(() => {
        if (isLoading) {
          console.log('AUTH STATE: Safety timeout triggered: forcing isLoading to false');
          setIsLoading(false);
        }
        if (authLoading) {
          console.log('AUTH STATE: Safety timeout triggered: forcing authLoading to false');
          setAuthLoading(false);
        }
      }, 5000); // 5 second maximum loading time
    }
    
    return () => {
      if (isClient && safetyTimeout) {
        clearTimeout(safetyTimeout);
      }
    };
  }, [authInitialized, isClient]); // Add isClient dependency

  // Helper to fetch user profile from database
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      console.log('Profile fetched successfully:', data);
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Exception fetching user profile:', error);
      return null;
    }
  };

  // Utility to check for guest session
  const checkGuestSession = async () => {
    if (!isClient) return;
    
    try {
      const guestProfileId = localStorage.getItem('guestProfileId');
      console.log('Checking for guest session:', guestProfileId);
      
      if (guestProfileId) {
        // Only proceed if we don't already have an authenticated user
        if (!user) {
          console.log('Found guest profile ID, fetching profile');
          
          const { data: guestProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', guestProfileId)
            .eq('is_guest', true)
            .maybeSingle();
          
          if (profileError) {
            console.error('Error fetching guest profile:', profileError);
            return;
          }
          
          if (guestProfile) {
            console.log('Found valid guest profile:', guestProfile);
            // Set guest profile as the active profile
            setProfile(guestProfile);
            
            // Mark that we have a valid guest session
            setGuestId(guestProfileId);
          } else {
            console.log('Guest profile not found or is not a guest, clearing localStorage');
            localStorage.removeItem('guestProfileId');
          }
        } else {
          console.log('Already have authenticated user, ignoring guest session');
        }
      } else {
        console.log('No guestProfileId found in localStorage');
      }
    } catch (err) {
      console.error('Error checking guest session:', err);
    }
  };

  // Ensure we have a valid session token
  const ensureSessionToken = async (): Promise<string | null> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session?.access_token || null;
    } catch (err) {
      console.error('Error getting session token:', err);
      return null;
    }
  };

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Create a safety timeout to prevent hanging
    const safetyTimeout = setTimeout(() => {
      console.log('Safety timeout reached in signIn');
      setIsLoading(false);
      toast.error('Request timed out. Please try again.');
    }, 10000);
    
    try {
      console.log('Signing in...', { email });
      
      // First, clear any existing guest session
      await clearGuestSession();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      console.log('Sign in successful:', data.user?.id);
      
      // Try to fetch the user profile
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profileError || !profileData) {
          console.log('Profile not found, creating one');
          await createEmptyProfile(data.user.id);
        } else {
          setProfile(profileData);
        }
      } catch (err) {
        console.error('Error handling profile during sign in:', err);
        await createEmptyProfile(data.user.id);
      }
      
      // Profile should be fetched automatically via the auth state change listener
      toast.success('Signed in successfully');
      
      // Handle redirect if needed
      if (isClient) {
        // Check if user has completed onboarding
        const { data: profileData } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', data.user.id)
          .single();
          
        let redirectPath = '/';
        
        // If redirectAfterAuth is set, use that
        const storedRedirect = localStorage.getItem('redirectAfterAuth');
        if (storedRedirect) {
          redirectPath = storedRedirect;
          localStorage.removeItem('redirectAfterAuth');
        } 
        // Otherwise, if onboarding not completed, redirect to onboarding
        else if (profileData && profileData.onboarding_completed === false) {
          redirectPath = '/onboarding';
        }
        // Otherwise, redirect to dashboard
        else {
          redirectPath = '/dashboard';
        }
        
        console.log('Redirecting to:', redirectPath);
        router.push(redirectPath as Route);
      }

    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error?.message || 'Error signing in. Please check your credentials.');
      throw error;
    } finally {
      clearTimeout(safetyTimeout);
      setIsLoading(false);
    }
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 10000); // Safety timeout in case something hangs
    
    try {
      console.log('Signing up...');
      setIsLoading(true);
      
      // Clear any guest session
      await clearGuestSession();
      
      // Sign up with Supabase Auth
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      console.log('Signup response:', response);

      if (response.error) {
        console.error('Sign up error:', response.error);
        throw response.error;
      }

      if (!response.data?.user) {
        console.error('No user data in successful response:', response);
        throw new Error('No user data returned from signup');
      }

      console.log('Signup successful:', response.data.user?.id);
      
      try {
        // Create an empty profile for the new user
        await createEmptyProfile(response.data.user.id);
        console.log('Empty profile created for new user');
        
        // Set the user and authentication state
        setUser(response.data.user);
        
        // Fetch and set the profile
        const userProfile = await fetchUserProfile(response.data.user.id);
        if (userProfile) {
          setProfile(userProfile);
        }
      } catch (profileError) {
        console.error('Error creating profile, but signup succeeded:', profileError);
        // Don't block the signup flow, continue anyway
      }
      
      if (!response.data.user.email_confirmed_at) {
        toast.success('Check your email to confirm your account!');
      } else {
        toast.success('Account created successfully!');
      }

      // Force redirect to onboarding after a short delay
      // This bypasses any potential navigation issues
      if (isClient) {
        // Use router for better navigation
        setTimeout(() => {
          console.log('Redirecting to onboarding...');
          // Using direct window.location for more reliable redirect
          window.location.href = '/onboarding';
        }, 1000);
      }

      return response;

    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error?.message || 'Error creating account. Please try again.');
      throw error;
    } finally {
      clearTimeout(safetyTimeout);
      setIsLoading(false);
    }
  };

  /**
   * Sign in with OAuth provider
   */
  const signInWithOAuth = async (provider: Provider) => {
    try {
      console.log(`Signing in with ${provider}...`);
      
      // Clear any guest session
      await clearGuestSession();

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

    } catch (error: any) {
      console.error(`Error signing in with ${provider}:`, error);
      toast.error(error?.message || `Error signing in with ${provider}`);
      throw error; 
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    setIsLoading(true);
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Clear user and profile state
      setUser(null);
      setProfile(null);
      
      // Also clear any guest session
      await clearGuestSession();
      
      toast.success('Signed out successfully');
      router.push('/' as Route); 

    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error(error?.message || 'Error signing out');
    } finally {
      setIsLoading(false);
    }
  };

  // Use default values during SSR to prevent hydration errors
  const value = isClient ? {
    user,
    profile,
    guestId,
    isLoading,
    authLoading,
    isGuest: !!guestId,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithOAuth, 
    signOut,
    setProfile: (newProfile: Profile | null) => {
      setProfile(newProfile);
    },
    clearGuestSession,
    createEmptyProfile,
    ensureSessionToken
  } : defaultContextValue;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
