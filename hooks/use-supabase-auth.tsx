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
  username?: string;
  display_name?: string;
  preferred_genres?: string[];
  bio?: string;
  theme_color?: string;
  onboarded?: boolean;
}

interface AuthContextType {
  user: any;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signInWithOAuth: (provider: Provider) => Promise<void>; 
  signOut: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  createEmptyProfile: (userId: string) => Promise<void>;
  ensureSessionToken: () => Promise<string | null>;
}

// Default context values for SSR to prevent hydration errors
const defaultContextValue: AuthContextType = {
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  authLoading: true,
  signIn: async () => { throw new Error('Not implemented') },
  signUp: async () => { throw new Error('Not implemented') },
  signInWithOAuth: async () => { throw new Error('Not implemented') },
  signOut: async () => { throw new Error('Not implemented') },
  setProfile: () => {},
  createEmptyProfile: async () => {},
  ensureSessionToken: async () => null
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set isClient flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Create an empty profile for a user
  const createEmptyProfile = async (userId: string): Promise<void> => {
    try {
      console.log('AUTH STATE: Creating empty profile for user:', userId);
      
      // First check if a profile already exists to avoid duplicates
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (checkError) {
        console.error('AUTH STATE: Error checking existing profile:', checkError);
        throw checkError;
      }
      
      // If the profile already exists, don't overwrite it
      if (existingProfile) {
        console.log('AUTH STATE: Profile already exists for user, skipping creation');
        return;
      }
      
      // Create base profile data
      const profileData = {
        id: userId,
        username: `user_${Date.now().toString(36)}`, // Generate a temporary username
        display_name: 'New User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        onboarded: false,
        preferred_genres: [],
        bio: '',
        theme_color: '#6366F1', // Default theme color (indigo)
      };
      
      console.log('AUTH STATE: Inserting new profile with data:', profileData);
      
      // Create the profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([profileData]);
      
      if (insertError) {
        console.error('AUTH STATE: Error creating profile:', insertError);
        throw insertError;
      }
      
      console.log('AUTH STATE: Profile created successfully');
      
      // Fetch the newly created profile and update state
      await fetchUserProfile(userId);
      
    } catch (error) {
      console.error('AUTH STATE: Failed to create empty profile:', error);
      throw error;
    }
  };

  // Initialize auth state
  useEffect(() => {
    if (!isClient || authInitialized) return;

    const initializeAuth = async () => {
      try {
        setAuthLoading(true);
        console.log('AUTH STATE: Initializing auth state');

        // Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          console.log('AUTH STATE: Session found, user is authenticated');
          setUser(session.user);
          
          try {
            // Fetch profile for the authenticated user
            await fetchUserProfile(session.user.id);
          } catch (profileError) {
            console.error('AUTH STATE: Error fetching profile:', profileError);
            // Non-fatal error, continue with auth flow
          }
        } else {
          console.log('AUTH STATE: No session found, user is not authenticated');
          setUser(null);
          setProfile(null);
        }

        // Set up auth state change listener
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('AUTH STATE: Auth state changed:', event, session?.user?.id);
            
            // Update user state based on session
            if (session?.user) {
              setUser(session.user);
              
              try {
                // Fetch profile when auth state changes to signed in
                if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
                  await fetchUserProfile(session.user.id);
                }
              } catch (profileError) {
                console.error('AUTH STATE: Error fetching profile on auth change:', profileError);
              }
            } else {
              // Clear user and profile state when signed out
              setUser(null);
              setProfile(null);
            }
          }
        );
        
        // Clean up subscription on unmount
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('AUTH STATE: Error initializing auth:', error);
      } finally {
        setAuthLoading(false);
        setAuthInitialized(true);
      }
    };

    initializeAuth();
  }, [supabase, isClient, authInitialized]);

  // Helper to fetch user profile from database
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('AUTH STATE: Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('AUTH STATE: Error fetching profile:', error);
        throw error;
      }
      
      if (data) {
        console.log('AUTH STATE: Profile found:', data.id);
        setProfile(data);
        return data;
      } else {
        console.log('AUTH STATE: No profile found for user:', userId);
        return null;
      }
    } catch (error) {
      console.error('AUTH STATE: Error in fetchUserProfile:', error);
      return null;
    }
  };

  // Ensure we have a valid session token
  const ensureSessionToken = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting session token:', error);
      return null;
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const safetyTimeout = setTimeout(() => {
      console.log('AUTH STATE: Sign in safety timeout triggered');
      setIsLoading(false);
    }, 15000); // 15s safety timeout
    
    try {
      console.log('AUTH STATE: Signing in with email...');
      setIsLoading(true);

      // Sign in with Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data?.user) {
        throw new Error('No user data returned from login');
      }

      // Set user state
      setUser(data.user);
      
      // Fetch and set profile
      const userProfile = await fetchUserProfile(data.user.id);
      
      // Check if the user has completed onboarding
      if (userProfile && userProfile.onboarded !== true) {
        console.log('AUTH STATE: User has not completed onboarding, redirecting...');
        toast.success('Welcome back! Please complete your profile.');
        
        // Use router for better navigation
        setTimeout(() => {
          console.log('Redirecting to onboarding...');
          router.push('/onboarding' as Route);
        }, 500);
      } else {
        console.log('AUTH STATE: User has completed onboarding');
        toast.success('Signed in successfully');
        
        // Use router for better navigation
        setTimeout(() => {
          console.log('Redirecting to home...');
          router.push('/' as Route);
        }, 500);
      }
    } catch (error: any) {
      console.error('AUTH STATE: Sign in error:', error);
      toast.error(error?.message || 'Error signing in. Please try again.');
      throw error;
    } finally {
      clearTimeout(safetyTimeout);
      setIsLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    const safetyTimeout = setTimeout(() => {
      console.log('AUTH STATE: Sign up safety timeout triggered');
      setIsLoading(false);
    }, 15000); // 15s safety timeout

    try {
      console.log('AUTH STATE: Signing up with email...');
      setIsLoading(true);

      // Sign up with Supabase auth
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: '',
          }
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
        
        // Set the user in state immediately
        setUser(response.data.user);
        
        // Fetch and set the profile
        const userProfile = await fetchUserProfile(response.data.user.id);
        if (userProfile) {
          setProfile(userProfile);
        }
        
        // Update the onboarded flag to ensure it's set properly
        if (userProfile) {
          // Ensure onboarded flag is explicitly set to false
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              onboarded: false 
            })
            .eq('id', response.data.user.id);
          
          if (updateError) {
            console.error('Error ensuring onboarded flag:', updateError);
          } else {
            console.log('Ensured onboarded flag is set to false');
          }
        }
      } catch (profileError) {
        console.error('Error creating profile, but signup succeeded:', profileError);
        // Don't block the signup flow, continue anyway
      }
      
      // Add an explicit marker for a new signup to help the onboarding page
      if (isClient) {
        localStorage.setItem('justSignedUp', 'true');
        localStorage.setItem('authUserId', response.data.user.id);
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
        }, 1500); // Slightly longer delay to ensure profile is created
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
    isLoading,
    authLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithOAuth, 
    signOut,
    setProfile: (newProfile: Profile | null) => {
      setProfile(newProfile);
    },
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
