'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type AuthContextType = {
  user: any;
  guestId: string | null;
  profile: any;
  isLoading: boolean;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  ensureSessionToken: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        // Check for guest ID in localStorage
        const storedGuestId = localStorage.getItem('guestProfileId') || localStorage.getItem('guest_id');
        if (storedGuestId) {
          // Verify the guest profile exists
          const { data: guestProfile, error: guestError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', storedGuestId)
            .single();

          if (guestError || !guestProfile) {
            // Clean up invalid guest ID
            localStorage.removeItem('guestProfileId');
            localStorage.removeItem('guest_id');
            setGuestId(null);
          } else {
            setGuestId(storedGuestId);
            if (!session?.user) {
              setProfile(guestProfile);
            }
          }
        }

        // If we have a user, load their profile
        if (session?.user) {
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error loading user profile:', profileError);
            toast.error('Error loading user profile');
          } else {
            setProfile(userProfile);
          }
        }
      } catch (error) {
        console.error('Error in loadUser:', error);
        toast.error('Error loading user data');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setAuthLoading(false);
      return { data, error };
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || 'Error signing in');
      // Ensure consistent return type
      return { data: null, error };
    } finally {
      setAuthLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setAuthLoading(true);
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        toast.error(error.message || 'Error signing up');
        return { data, error };
      }

      if (data.user) {
        // Create profile for new user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          toast.error('Error creating profile');
          return { data, error: profileError };
        }

        toast.success('Account created successfully! Please check your email to confirm your account.');
      }

      return { data, error };
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error(error.message || 'Error signing up');
      return { data: null, error };
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setAuthLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      toast.success('Signed out successfully');
      router.push('/');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error(error.message || 'Error signing out');
    } finally {
      setAuthLoading(false);
    }
  };

  const ensureSessionToken = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }
    } catch (error) {
      console.error('Error ensuring session token:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      guestId,
      profile,
      isLoading,
      authLoading,
      signIn,
      signUp,
      signOut,
      ensureSessionToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
