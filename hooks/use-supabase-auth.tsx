'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import type { Provider } from '@supabase/supabase-js'; 
import type { Route } from 'next'; 

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  is_guest?: boolean;
}

interface AuthContextType {
  user: any;
  profile: Profile | null;
  guestId: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: Provider) => Promise<void>; 
  signOut: () => Promise<void>;
  setProfile: (profile: Profile | null) => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        setIsLoading(true); 

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
        }

        const initialUser = session?.user ?? null;
        setUser(initialUser);

        let initialProfile: Profile | null = null;

        const storedGuestId = localStorage.getItem('guestProfileId');
        console.log('Stored guest ID:', storedGuestId);
        if (storedGuestId && !initialUser) { 
          setGuestId(storedGuestId);
          console.log('Fetching guest profile...');
          const { data: guestProfile, error: guestError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', storedGuestId)
            .eq('is_guest', true)
            .single();

          if (guestError) {
            console.error('Guest profile error:', guestError);
            localStorage.removeItem('guestProfileId');
            setGuestId(null);
          } else if (guestProfile) {
            console.log('Guest profile loaded:', guestProfile);
            initialProfile = guestProfile;
          }
        }

        if (initialUser) {
          console.log('Fetching user profile...');
          setGuestId(null); 
          localStorage.removeItem('guestProfileId');
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', initialUser.id)
            .single();

          if (profileError) {
            console.error('User profile error:', profileError);
          } else if (userProfile) {
            console.log('User profile loaded:', userProfile);
            initialProfile = userProfile;
          }
        }

        setProfile(initialProfile);

      } catch (error) {
        console.error('Error initializing auth:', error);
        toast.error('Error loading user data');
      } finally {
        setIsLoading(false); 
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', { event, session });
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      setIsLoading(true); 

      if (currentUser) {
        setGuestId(null); 
        localStorage.removeItem('guestProfileId'); 

        if (!profile || profile.id !== currentUser.id) {
          console.log('Fetching profile for logged-in/changed user...');
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

          if (profileError) {
            console.error('User profile error on auth change:', profileError);
            setProfile(null);
          } else if (userProfile) {
            console.log('User profile loaded on auth change:', userProfile);
            setProfile(userProfile);
          }
        }

      } else {
        setProfile(null);
      }

      setIsLoading(false); 
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, router]); 

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Signing in...', { email });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      setProfile(profile);
      toast.success('Signed in successfully');

      localStorage.removeItem('guestProfileId');
      setGuestId(null);

      const redirectPath = localStorage.getItem('redirectAfterAuth') || '/';
      localStorage.removeItem('redirectAfterAuth');
      router.push(redirectPath as any); 

    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || 'Error signing in');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Signing up...', { email });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user!.id,
            email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      toast.success('Account created successfully! Please check your email to verify your account.');
      router.push('/auth/verify' as Route); 

    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error(error.message || 'Error creating account');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithOAuth = async (provider: Provider) => {
    try {
      console.log(`Signing in with ${provider}...`);

      localStorage.removeItem('guestProfileId');
      setGuestId(null);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL || `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

    } catch (error: any) {
      console.error(`Error signing in with ${provider}:`, error);
      toast.error(error.message || `Error signing in with ${provider}`);
      throw error; 
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      console.log('Signing out...');
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      router.push('/' as const); 

    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error(error.message || 'Error signing out');
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
