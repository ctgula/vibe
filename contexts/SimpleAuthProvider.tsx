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

export const SimpleAuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<User | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        console.log("Checking auth session...");
        
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
          // Handle guest fallback
          const storedGuestId = localStorage.getItem("guest_id") || localStorage.getItem("guestProfileId");
          
          if (!storedGuestId) {
            // Create new guest ID
            const newGuestId = uuidv4();
            console.log("Creating new guest ID:", newGuestId);
            localStorage.setItem("guest_id", newGuestId);
            localStorage.setItem("guestProfileId", newGuestId); // For compatibility
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
        }
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
  }, [supabase]);

  // Derived states
  const isAuthenticated = Boolean(user || guestId);
  const isGuest = Boolean(!user && guestId);

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div>Checking authentication...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        guestId, 
        loading, 
        isAuthenticated, 
        isGuest,
        profile
      }}
    >
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
