"use client";

import { useEffect, useState } from "react";
import { supabase, Profile } from "@/lib/supabase";
import { useAuth } from "./use-supabase-auth";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        setIsLoading(true);
        
        if (!user) {
          setError(new Error("User not found"));
          setIsLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        setProfile(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
    
    // Set up real-time subscription for profile updates
    const profileSubscription = supabase
      .channel(`profile-channel-${user.id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, 
        (payload) => {
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();
    
    return () => {
      // Clean up subscription
      if (profileSubscription) {
        supabase.removeChannel(profileSubscription);
      }
    };
  }, [user?.id]);

  // Update profile
  const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'created_at'>>) => {
    if (!user) throw new Error("You must be logged in to update your profile");
    
    try {
      // Add haptic feedback for better mobile experience
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([3, 10, 3]);
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile
  };
}
