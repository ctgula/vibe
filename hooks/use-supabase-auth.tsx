'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/use-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type UserProfile = {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  theme_color?: string;
  is_guest: boolean;
  created_at?: string;
  updated_at?: string;
};

type AuthContextType = {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  guestId: string | null;
  isLoading: boolean;
  authLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  createGuestSession: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ data: any | null; error: any | null }>;
  signInWithGoogle: () => Promise<{ data: any | null; error: any | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error: string | null }>;
  ensureSessionToken: () => Promise<boolean>;
  clearGuestSession: () => Promise<void>;
  signUp: (email: string, password: string, username: string, displayName?: string) => Promise<{ data: any | null; error: any | null }>;
  signIn: (email: string, password: string) => Promise<{ data: any | null; error: any | null }>;
};

const supabase = createClientComponentClient();

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, []);

  const createGuestSession = useCallback(async () => {
    try {
      const newGuestId = crypto.randomUUID();
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert([{ id: newGuestId, is_guest: true }])
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem('guestProfileId', newGuestId);
      setGuestId(newGuestId);
      setProfile(profile);
      router.push('/onboarding');
    } catch (error) {
      console.error('Error creating guest profile:', error);
      toast({
        description: 'Failed to create guest profile',
        variant: 'destructive'
      });
    }
  }, [router, toast]);

  const signInWithMagicLink = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      toast({
        description: 'Check your email for the magic link.',
      });
      return { data, error: null };
    } catch (error: any) {
      toast({
        description: error.message || 'Failed to send magic link',
        variant: 'destructive'
      });
      return { data: null, error };
    }
  }, [toast]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      toast({
        description: error.message || 'Failed to sign in with Google',
        variant: 'destructive'
      });
      return { data: null, error };
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      router.push('/');
    } catch (error: any) {
      toast({
        description: error.message || 'Failed to sign out',
        variant: 'destructive'
      });
    }
  }, [router, toast]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user?.id);

      if (error) throw error;

      await loadProfile(user?.id);
      toast({
        description: 'Profile updated successfully.'
      });
      return { success: true, error: null };
    } catch (error: any) {
      toast({
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
      return { success: false, error: error.message };
    }
  }, [loadProfile, user, toast]);

  const ensureSessionToken = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    } catch (error) {
      console.error('Error in ensureSessionToken:', error);
      return false;
    }
  }, []);

  const clearGuestSession = useCallback(async () => {
    try {
      localStorage.removeItem('guestProfileId');
      setGuestId(null);
    } catch (error) {
      console.error('Error in clearGuestSession:', error);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, username: string, displayName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) throw error;

      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: data.user.id,
              email,
              username,
              display_name: displayName || username,
              is_guest: false
            }]);

          if (profileError) throw profileError;
        } catch (profileError) {
          console.error('Error creating profile:', profileError);
          toast({
            description: 'Failed to create profile',
            variant: 'destructive'
          });
        }
      }

      toast({
        description: 'Check your email to confirm your account'
      });
      return { data, error: null };
    } catch (error: any) {
      toast({
        description: error.message || 'Failed to sign up',
        variant: 'destructive'
      });
      return { data: null, error };
    }
  }, [toast]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      toast({
        description: error.message || 'Failed to sign in',
        variant: 'destructive'
      });
      return { data: null, error };
    }
  }, [toast]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          // Try to get guest ID
          const guestId = localStorage.getItem('guestProfileId') || localStorage.getItem('guest_id');
          if (guestId) {
            // Try to load guest profile
            const { data: guestProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', guestId)
              .eq('is_guest', true)
              .single();

            if (guestProfile) {
              setProfile(guestProfile);
              setGuestId(guestId);
            } else {
              // Guest profile not found, clear local storage
              localStorage.removeItem('guestProfileId');
              localStorage.removeItem('guest_id');
              setGuestId(null);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo(() => ({
    user,
    profile,
    guestId,
    isLoading,
    authLoading,
    isAuthenticated: !!user,
    isGuest: !user && !!guestId,
    createGuestSession,
    signInWithMagicLink,
    signInWithGoogle,
    signOut,
    updateProfile,
    ensureSessionToken,
    clearGuestSession,
    signUp,
    signIn
  }), [user, profile, guestId, isLoading, authLoading, createGuestSession, signInWithMagicLink, signInWithGoogle, signOut, updateProfile, ensureSessionToken, clearGuestSession, signUp, signIn]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
