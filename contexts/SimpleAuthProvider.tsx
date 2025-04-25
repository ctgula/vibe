'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session, User } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

type AuthContextType = {
  user: User | null;
  guestId: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  profile: any | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Default values for server-side rendering to prevent hydration errors
const defaultContextValue: AuthContextType = {
  user: null,
  guestId: null,
  loading: true,
  isAuthenticated: false,
  isGuest: false,
  profile: null
};

export const SimpleAuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<User | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Safe check for client-side to avoid localStorage errors during SSR
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run authentication logic on the client side
    if (!isClient) return;

    const getSession = async () => {
      try {
        console.log("Checking auth session...");
        
        // Add a safety timeout to prevent infinite loading state
        const safetyTimeout = setTimeout(() => {
          if (loading) {
            console.log("Safety timeout triggered: forcing loading to false");
            setLoading(false);
          }
        }, 5000);
        
        // Check for authenticated user first
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
        }

        if (session?.user) {
          console.log("Found authenticated user:", session.user.id);
          setUser(session.user);
          
          // Fetch user profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileData) {
            console.log("Found user profile");
            setProfile(profileData);
          } else if (profileError) {
            console.error("Error fetching profile:", profileError);
          }
        } else {
          // Handle guest fallback - Wrap localStorage access in try/catch
          try {
            // First check for guestProfileId (primary) then guest_id (legacy)
            const storedGuestId = localStorage.getItem("guestProfileId") || localStorage.getItem("guest_id");
            
            if (!storedGuestId) {
              // Create new guest ID
              const newGuestId = uuidv4();
              console.log("Creating new guest ID:", newGuestId);
              localStorage.setItem("guestProfileId", newGuestId);
              localStorage.setItem("guest_id", newGuestId); // For compatibility
              setGuestId(newGuestId);
              
              // We'll create the profile when needed, not here
            } else {
              console.log("Found existing guest ID:", storedGuestId);
              setGuestId(storedGuestId);
              
              // Try to fetch existing guest profile
              const { data: guestProfile, error: guestProfileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', storedGuestId)
                .eq('is_guest', true)
                .single();
                
              if (guestProfile) {
                console.log("Found guest profile");
                setProfile(guestProfile);
              } else {
                console.log("No guest profile found or error:", guestProfileError);
              }
            }
          } catch (err) {
            console.error("Error accessing localStorage:", err);
            // Generate a temporary in-memory guest ID that won't persist
            const tempGuestId = uuidv4();
            setGuestId(tempGuestId);
          }
        }
        
        // Clear the safety timeout
        clearTimeout(safetyTimeout);
      } catch (err) {
        console.error("Unexpected error in auth initialization:", err);
      } finally {
        setLoading(false);
        console.log("Auth initialization complete");
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        if (session?.user) {
          setUser(session.user);
          setGuestId(null); // Clear guest ID when user logs in
          
          // Fetch user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileData) {
            setProfile(profileData);
          }
        } else {
          setUser(null);
          // Don't clear guestId here - we want to fall back to guest mode
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, isClient]); // Add isClient dependency

  // Derived states
  const isAuthenticated = Boolean(user || guestId);
  const isGuest = Boolean(!user && guestId);

  // Use default values during SSR and actual values on client
  const contextValue = isClient ? {
    user,
    guestId,
    loading,
    isAuthenticated,
    isGuest,
    profile
  } : defaultContextValue;

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useSimpleAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useSimpleAuth must be used within a SimpleAuthProvider");
  }
  return context;
};
