'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

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
  signOut: () => Promise<void>;
  setProfile: (profile: Profile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debug logs
  console.log('AuthProvider render:', { user, profile, guestId, isLoading });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        console.log('Session loaded:', session);
        setUser(session?.user ?? null);

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state change:', { event, session });
          setUser(session?.user ?? null);
          
          if (event === 'SIGNED_OUT') {
            setProfile(null);
            router.push('/');
          }
        });

        // Check for guest ID in localStorage
        const storedGuestId = localStorage.getItem('guestProfileId');
        console.log('Stored guest ID:', storedGuestId);

        if (storedGuestId) {
          setGuestId(storedGuestId);
          
          // If we have a guest ID but no profile, fetch the guest profile
          if (!profile) {
            console.log('Fetching guest profile...');
            const { data: guestProfile, error: guestError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', storedGuestId)
              .single();

            if (guestError) {
              console.error('Guest profile error:', guestError);
              // Clear invalid guest ID
              localStorage.removeItem('guestProfileId');
              setGuestId(null);
            } else if (guestProfile) {
              console.log('Guest profile loaded:', guestProfile);
              setProfile(guestProfile);
            }
          }
        }

        // If we have a user but no profile, fetch their profile
        if (session?.user && !profile) {
          console.log('Fetching user profile...');
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('User profile error:', profileError);
          } else if (userProfile) {
            console.log('User profile loaded:', userProfile);
            setProfile(userProfile);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsLoading(false);
        toast.error('Error loading user data');
      }
    };

    initializeAuth();
  }, [supabase, router]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in...', { email });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      setProfile(profile);
      toast.success('Signed in successfully');

      // Clear any guest session
      localStorage.removeItem('guestProfileId');
      setGuestId(null);

      // Get redirect path or default to home
      const redirectPath = localStorage.getItem('redirectAfterAuth') || '/';
      localStorage.removeItem('redirectAfterAuth');
      router.push(redirectPath);

    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || 'Error signing in');
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Signing up...', { email });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Create profile for new user
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
      router.push('/auth/verify');

    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error(error.message || 'Error creating account');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      toast.success('Signed out successfully');
      router.push('/');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error(error.message || 'Error signing out');
    }
  };

  const value = {
    user,
    profile,
    guestId,
    isLoading,
    signIn,
    signUp,
    signOut,
    setProfile,
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
