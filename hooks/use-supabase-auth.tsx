'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useMemo, 
  ReactNode 
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { AuthContextType, UserProfile } from '@/types/auth';
import { createBrowserClient } from '@supabase/ssr';

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
  signInWithMagicLink: async () => ({ data: null, error: null }),
  signInWithGoogle: async () => ({ data: null, error: null }),
  signOut: async () => {},
  updateProfile: async () => ({ success: false, error: null }),
  ensureSessionToken: async () => false,
  clearGuestSession: async () => {},
  signUp: async () => ({ data: null, error: null }),
  signIn: async () => ({ data: null, error: null })
};

// Create the AuthContext with the default value
const AuthContext = createContext<AuthContextType>(defaultContextValue);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [supabase, setSupabase] = useState<any>(null);

  // Flag to indicate client-side rendering
  useEffect(() => {
    setIsClient(true);
    
    // Initialize Supabase client on the client side
    if (typeof window !== 'undefined') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      setSupabase(createBrowserClient(supabaseUrl, supabaseAnonKey));
    }
  }, []);

  // Check for guest session
  useEffect(() => {
    if (!isClient) return;

    const getLocalGuestId = () => {
      const guestProfileId = localStorage.getItem('guestProfileId');
      setGuestId(guestProfileId);
      setAuthLoading(false);
    };

    getLocalGuestId();
  }, [isClient]);

  // Set up Supabase auth listener
  useEffect(() => {
    if (!isClient || !supabase) return;
    
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setAuthLoading(false);
          return;
        }

        const session = data.session;
        
        if (session) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
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
        if (session) {
          setUser(session.user);
          
          // Fetch profile and create if needed
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError || !profileData) {
            console.log('Profile not found, creating via API');
            try {
              const response = await fetch('/api/auth/create-profile', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user: session.user }),
              });

              if (response.ok) {
                // Refetch profile after creation
                const { data: newProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                  
                setProfile(newProfile || null);
              } else {
                console.error('Failed to create profile via API:', await response.text());
              }
            } catch (error) {
              console.error('Error calling create-profile API:', error);
            }
          } else {
            setProfile(profileData);
          }
          
          setAuthLoading(false);
        } else {
          setUser(null);
          setProfile(null);
          setAuthLoading(false);
        }
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isClient, supabase]);

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    if (!supabase) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setAuthLoading(false);
      setIsLoading(false);
    }
  };

  // Create guest session
  const createGuestSession = async (): Promise<string | null> => {
    if (!isClient || !supabase) {
      return null;
    }

    try {
      setIsLoading(true);
      
      // Generate a unique ID for the guest
      const newGuestId = uuidv4();
      
      // Generate a random username
      const guestUsername = `guest_${Math.floor(Math.random() * 100000)}`;
      
      // Insert the guest profile
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
          description: "Failed to create guest profile.",
          variant: "destructive"
        });
        return null;
      }

      // Store the guest ID in localStorage
      localStorage.setItem('guestProfileId', newGuestId);
      
      // Generate a secure random session token
      const sessionToken = uuidv4();
      localStorage.setItem('guestSessionToken', sessionToken);
      
      // Update the state
      setGuestId(newGuestId);
      
      // Success toast
      toast({
        title: "Success",
        description: "You've joined as a guest!",
        variant: "default"
      });
      
      return newGuestId;
    } catch (error) {
      console.error('Error in createGuestSession:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with email, password, username, and displayName
  const signUp = async (
    email: string,
    password: string,
    username: string,
    displayName?: string
  ): Promise<{ data: any | null; error: any | null }> => {
    if (!supabase) return { data: null, error: new Error("Supabase client not initialized") };
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
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
      // Only create profile if user exists and username is provided
      if (data?.user && username) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                email,
                username,
                display_name: displayName || username,
                is_guest: false
              }
            ]);
          if (profileError) {
            console.error('Error creating profile:', profileError);
            toast({
              title: "Warning",
              description: "Profile not fully created. You can update it later.",
              variant: "destructive"
            });
          }
        } catch (profileError) {
          console.error('Error calling create-profile API:', profileError);
          // Don't fail the signup if profile creation fails
        }
      }
      toast({
        title: "Success",
        description: "Check your email for the confirmation link",
        variant: "default"
      });
      return { data, error: null };
    } catch (error) {
      console.error('Error in signUp:', error);
      toast({
        title: "Error",
        description: "Could not sign up. Please try again.",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<{ data: any | null; error: any | null }> => {
    if (!supabase) return { data: null, error: new Error("Supabase client not initialized") };
    
    setIsLoading(true);
    try {
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

      toast({
        title: "Success",
        description: "Signed in successfully",
        variant: "default"
      });
      return { data, error: null };
    } catch (error) {
      console.error('Error in signIn:', error);
      toast({
        title: "Error",
        description: "Could not sign in. Please try again.",
        variant: "destructive"
      });
      return { data: null, error };
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
    } catch (error) {
      console.error('Error in clearGuestSession:', error);
    }
  };

  // Sign in with magic link
  const signInWithMagicLink = async (email: string): Promise<{ data: any | null; error: any | null }> => {
    if (!supabase) return { data: null, error: new Error("Supabase client not initialized") };
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Error sending magic link:', error);
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

      return { data, error: null };
    } catch (error) {
      console.error('Error in signInWithMagicLink:', error);
      toast({
        title: "Error",
        description: "Could not send magic link. Please try again.",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (): Promise<{ data: any | null; error: any | null }> => {
    if (!supabase) return { data: null, error: new Error("Supabase client not initialized") };
    
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

      return { data, error: null };
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
      toast({
        title: "Error",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
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
        
        toast({
          title: "Success",
          description: "You've been signed out.",
          variant: "default"
        });
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

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error: string | null }> => {
    if (!supabase || !user) return { success: false, error: "No authenticated user" };
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

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
      await fetchProfile(user.id);

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

  // Ensure session token for API requests
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
  const isGuest = !user && !!guestId;

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
    signUp: (email: string, password: string, username: string, displayName?: string) => signUp(email, password, username, displayName),
    signIn
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
