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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signInWithOAuth: (provider: Provider) => Promise<void>; 
  signOut: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  clearGuestSession: () => Promise<void>; 
  createEmptyProfile: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Clear guest session helper
  const clearGuestSession = async () => {
    localStorage.removeItem('guestProfileId');
    setGuestId(null);
  };

  // Create an empty profile for a user
  const createEmptyProfile = async (userId: string) => {
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
      return data;
    } catch (err) {
      console.error('Exception creating empty profile:', err);
      throw err;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        setIsLoading(true); 

        // 1. Check for authenticated session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          throw sessionError;
        }
        
        // 2. Set up auth state change listener
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('Auth state changed:', event, newSession?.user?.id);
            
            // Update user state
            const newUser = newSession?.user || null;
            setUser(prev => {
              // Only update if actually different to avoid re-renders
              if (JSON.stringify(prev?.id) !== JSON.stringify(newUser?.id)) {
                return newUser;
              }
              return prev;
            });
            
            // If user logs in or changes, fetch their profile
            if (newUser) {
              try {
                // Try to fetch profile
                const userProfile = await fetchUserProfile(newUser.id);
                
                // If no profile exists, create an empty one
                if (!userProfile) {
                  console.log('No profile found, creating empty profile');
                  await createEmptyProfile(newUser.id);
                  
                  // Fetch the newly created profile
                  await fetchUserProfile(newUser.id);
                }
              } catch (err) {
                console.error('Error handling user profile:', err);
              }
              
              // Clear any guest session on successful auth
              await clearGuestSession();
            } else if (event === 'SIGNED_OUT') {
              setProfile(null);
            }
          }
        );

        // 3. Set initial user state
        const initialUser = session?.user ?? null;
        setUser(initialUser);
        
        // 4. If there's an authenticated user, fetch their profile
        if (initialUser) {
          try {
            // Try to fetch profile
            const userProfile = await fetchUserProfile(initialUser.id);
            
            // If no profile exists, create an empty one
            if (!userProfile) {
              console.log('No profile found, creating empty profile');
              await createEmptyProfile(initialUser.id);
              
              // Fetch the newly created profile
              await fetchUserProfile(initialUser.id);
            }
          } catch (err) {
            console.error('Error handling initial user profile:', err);
          }
          
          // Clear any guest sessions when there's an authenticated user
          await clearGuestSession();
        } else {
          // 5. No authenticated user, check for guest session
          await checkGuestSession();
        }
        
        setAuthInitialized(true);
        setIsLoading(false);
        
        // Cleanup auth listener on unmount
        return () => {
          authListener.subscription.unsubscribe();
        };

      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsLoading(false);
        setAuthInitialized(true);
        toast.error('Error initializing authentication. Please try again.');
      }
    };

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

    // Helper to check for guest session
    const checkGuestSession = async () => {
      const storedGuestId = localStorage.getItem('guestProfileId');
      if (!storedGuestId) return null;
      
      try {
        console.log('Checking guest session:', storedGuestId);
        setGuestId(storedGuestId);
        
        // Fetch guest profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', storedGuestId)
          .eq('is_guest', true)
          .single();
        
        if (error || !data) {
          console.error('Guest profile error or not found:', error);
          await clearGuestSession();
          return null;
        }
        
        console.log('Guest profile loaded:', data);
        setProfile(data);
        return data;
      } catch (error) {
        console.error('Exception checking guest session:', error);
        await clearGuestSession();
        return null;
      }
    };

    initializeAuth();
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
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
      const redirectPath = localStorage.getItem('redirectAfterAuth') || '/';
      localStorage.removeItem('redirectAfterAuth');
      router.push(redirectPath as Route); 

    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error?.message || 'Error signing in. Please check your credentials.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      console.log('Starting sign up...', { email });
      
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

      if (response.error) {
        console.error('Sign up error:', response.error);
        throw response.error;
      }

      if (!response.data?.user) {
        console.error('No user data in successful response:', response);
        throw new Error('No user data returned from signup');
      }

      console.log('Signup successful:', response.data.user?.id);
      
      // Create an empty profile for the new user
      await createEmptyProfile(response.data.user.id);
      
      if (!response.data.user.email_confirmed_at) {
        toast.success('Check your email to confirm your account!');
      } else {
        toast.success('Account created successfully');
      }

      return response;

    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error?.message || 'Error creating account. Please try again.');
      throw error;
    } finally {
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

  const value = {
    user,
    profile,
    guestId,
    isLoading,
    signIn,
    signUp,
    signInWithOAuth, 
    signOut,
    setProfile: (newProfile: Profile | null) => {
      setProfile(newProfile);
    },
    clearGuestSession,
    createEmptyProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
