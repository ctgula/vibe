"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';

type AuthContextType = {
  user: any;
  profile: any;
  isLoading: boolean;
  authLoading: boolean;
  guestId: string | null;
  signOut: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<{ data?: any; error?: any }>;
  createGuestSession: (username?: string) => Promise<string | null>;
  signInWithMagicLink: (email: string) => Promise<{ data?: any; error?: any }>;
  signInWithGoogle: () => Promise<{ data?: any; error?: any }>;
  ensureSessionToken: () => Promise<void>;
  isAuthenticated: boolean;
  isGuest: boolean;
  clearGuestSession: () => Promise<void>;
};

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [guestSessionToken, setGuestSessionToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { toast } = useToast();

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    console.log('Initializing auth state...');
    
    // Check for existing guest session
    if (typeof window !== 'undefined') {
      try {
        // First check for authenticated user
        const checkAuthState = async () => {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            console.log('Found authenticated user:', data.session.user.id);
            // Auth state change listener will handle the rest
            return;
          }
          
          // If no authenticated user, check for guest ID
          const storedGuestId = localStorage.getItem('guestProfileId') || localStorage.getItem('guest_id');
          
          if (!storedGuestId) {
            // Create a new guest ID if none exists
            const newGuestId = crypto.randomUUID();
            console.log('Creating new guest ID:', newGuestId);
            localStorage.setItem('guestProfileId', newGuestId);
            localStorage.setItem('guest_id', newGuestId); // For compatibility
            setGuestId(newGuestId);
          } else {
            console.log('Found stored guest ID:', storedGuestId);
            setGuestId(storedGuestId);
            
            // Check for session token
            const storedGuestToken = localStorage.getItem('guestSessionToken');
            if (storedGuestToken) {
              setGuestSessionToken(storedGuestToken);
              await setSupabaseSessionToken(storedGuestToken);
            }
          }
          
          // Always set loading to false after guest ID is handled
          setIsLoading(false);
          console.log('Auth initialization complete', { 
            guestId: storedGuestId || 'new guest created', 
            isLoading: false 
          });
        };
        
        checkAuthState();
      } catch (error) {
        console.error('Error during auth initialization:', error);
        // Ensure loading is set to false even on error
        setIsLoading(false);
      }
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    if (!isClient) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, !!session);
      
      if (session?.user) {
        setUser(session.user);
        
        try {
          // Check if profile exists
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileData) {
            console.log('✅ Found user profile:', session.user.id);
            setProfile(profileData);
            // Clear any guest session when logging in as a user
            await clearGuestSession();
          } else if (error) {
            console.error('Error fetching user profile:', error);
            // Create profile if it doesn't exist
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: session.user.id,
                  username: session.user.email?.split('@')[0] || `user_${Math.random().toString(36).substring(2, 8)}`,
                  email: session.user.email,
                  is_guest: false,
                  created_at: new Date().toISOString()
                }
              ])
              .select()
              .single();
              
            if (newProfile && !createError) {
              console.log('✅ Created new user profile:', session.user.id);
              setProfile(newProfile);
            } else {
              console.error('Error creating user profile:', createError);
              toast({
                title: "Error",
                description: "Failed to create user profile",
                variant: "destructive"
              });
            }
          }
        } catch (error) {
          console.error('Error in profile check/creation:', error);
        }
      } else {
        setUser(null);
        
        // Don't clear profile if we have a guest session
        if (!guestId) {
          setProfile(null);
        }
      }
      
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isClient, supabase, guestId, toast]);

  // Check for guest profile when guestId changes
  useEffect(() => {
    if (!isClient || !guestId || user) return;
    
    const checkGuestProfile = async () => {
      try {
        console.log('Checking guest profile in AuthProvider for ID:', guestId);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', guestId)
          .eq('is_guest', true)
          .single();
          
        if (data && !error) {
          console.log('✅ Found guest profile in AuthProvider:', guestId);
          setProfile(data);
        } else {
          console.log('❌ Guest profile not found or error in AuthProvider:', error);
          // Don't clear guestId here, as it might still be valid
          // Just log the error
        }
      } catch (error) {
        console.error('Error checking guest profile in AuthProvider:', error);
      }
    };
    
    checkGuestProfile();
  }, [isClient, guestId, user, supabase]);

  // Helper function to set the session token in Supabase
  const setSupabaseSessionToken = async (token: string | null) => {
    if (!token) return false;
    
    try {
      await supabase.rpc('set_config', { key: 'session_token', value: token });
      console.log('✅ Guest session token set in Supabase');
      return true;
    } catch (error) {
      console.error('Could not set session token in Supabase:', error);
      return false;
    }
  };

  // Create guest session
  const createGuestSession = async (username?: string) => {
    if (!isClient) {
      return null;
    }

    try {
      setIsLoading(true);
      
      // Check if user is already authenticated
      if (user) {
        toast({
          title: "Already Authenticated",
          description: "You are already signed in as a user.",
          variant: "destructive"
        });
        return null;
      }
      
      // Generate a new UUID for the guest
      const newGuestId = uuidv4();
      const guestUsername = username || `guest_${Math.random().toString(36).substring(2, 8)}`;
      
      console.log('Creating guest profile with ID:', newGuestId);
      
      // Create guest profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: newGuestId,
            username: guestUsername,
            display_name: `Guest ${guestUsername.substring(6)}`,
            avatar_url: null,
            is_guest: true,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (profileError) {
        console.error('Error creating guest profile:', profileError);
        toast({
          title: "Error",
          description: "Failed to create guest profile",
          variant: "destructive"
        });
        return null;
      }

      // Generate and store session token
      const sessionToken = uuidv4();
      localStorage.setItem('guestProfileId', newGuestId);
      localStorage.setItem('guestSessionToken', sessionToken);
      
      setGuestId(newGuestId);
      setGuestSessionToken(sessionToken);
      setProfile(profileData);
      
      const success = await setSupabaseSessionToken(sessionToken);
      if (!success) {
        toast({
          title: "Warning",
          description: "Guest session created but token not set. Some features may be limited.",
          variant: "default"
        });
      }
      
      return newGuestId;
    } catch (error) {
      console.error('Error in createGuestSession:', error);
      toast({
        title: "Error",
        description: "Could not create guest session. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear guest session
  const clearGuestSession = async () => {
    try {
      localStorage.removeItem('guestProfileId');
      localStorage.removeItem('guestSessionToken');
      setGuestId(null);
      setGuestSessionToken(null);
      setProfile(null);
      await setSupabaseSessionToken(null);
    } catch (error) {
      console.error('Error clearing guest session:', error);
    }
  };

  // Sign out
  const signOut = async () => {
    if (!isClient) return;
    
    try {
      setIsLoading(true);
      
      if (user) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      
      // Clear guest session if present
      await clearGuestSession();
      
      setUser(null);
      setProfile(null);
      
      router.push('/');
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

  // Update user profile
  const updateProfile = async (profileData: any) => {
    if (!isClient) {
      return { error: new Error('Cannot update profile on server') };
    }
    
    try {
      setIsLoading(true);
      
      const profileId = user?.id || guestId;
      
      if (!profileId) {
        console.error('No user ID found in checkProfile');
        toast({
          title: "No Profile",
          description: "No user or guest profile found",
          variant: "destructive"
        });
        return { error: new Error('No user or guest ID found') };
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', profileId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive"
        });
        return { error };
      }
      
      setProfile(data);
      toast({
        title: "Success",
        description: "Profile updated successfully",
        variant: "default"
      });
      return { data };
    } catch (error) {
      console.error('Error in updateProfile:', error);
      toast({
        title: "Error",
        description: "Could not update profile. Please try again.",
        variant: "destructive"
      });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with magic link
  const signInWithMagicLink = async (email: string) => {
    if (!isClient) {
      return { error: new Error('Cannot sign in on server') };
    }
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Check your email for the magic link",
        variant: "default"
      });
      return { data };
    } catch (error) {
      console.error('Error in signInWithMagicLink:', error);
      toast({
        title: "Error",
        description: "Could not send magic link. Please try again.",
        variant: "destructive"
      });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    if (!isClient) {
      return { error: new Error('Cannot sign in on server') };
    }
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Signed in with Google",
        variant: "default"
      });
      return { data };
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
      toast({
        title: "Error",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive"
      });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure session token is set (used for guest sessions)
  const ensureSessionToken = async () => {
    if (!isClient || !guestSessionToken) return;
    
    try {
      await setSupabaseSessionToken(guestSessionToken);
    } catch (error) {
      console.error('Error ensuring session token:', error);
      toast({
        title: "Warning",
        description: "Could not set guest session token. Some features may be limited.",
        variant: "default"
      });
    }
  };

  // Determine authentication state
  const isAuthenticated = Boolean(user || guestId);
  const isGuest = Boolean(!user && guestId);

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
    clearGuestSession
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
