'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './use-supabase-auth';
import { createBrowserClient } from '@supabase/ssr';

type GuestProfile = {
  id: string;
  name: string;
  avatar_url: string;
};

export function useGuestSession() {
  const { guestId } = useAuth();
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    // Initialize Supabase client on the client side
    if (typeof window !== 'undefined') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      setSupabase(createBrowserClient(supabaseUrl, supabaseAnonKey));
    }
  }, []);

  useEffect(() => {
    if (!isClient || !supabase || !guestId) {
      setGuestProfile(null);
      setLoading(false);
      return;
    }
    
    const fetchGuestProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('id', guestId)
          .single();

        if (error) {
          console.error('Error fetching guest profile:', error);
          setError(new Error(error.message));
          setGuestProfile(null);
        } else {
          setGuestProfile({
            id: data.id,
            name: data.display_name,
            avatar_url: data.avatar_url
          });
          setError(null);
        }
      } catch (err) {
        console.error('Error in fetchGuestProfile:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setGuestProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGuestProfile();
  }, [guestId, isClient, supabase]);

  const logout = async () => {
    if (!isClient) return; // Don't run on server
    
    localStorage.removeItem('guestProfileId');
    localStorage.removeItem('guestSessionToken');
    setGuestProfile(null);
  };

  const createGuestSession = async (username?: string) => {
    // This is just a stub - the real implementation is in useAuth
    return null;
  };

  return {
    guestId,
    guestProfile,
    loading,
    logout,
    error,
    createGuestSession
  };
}
