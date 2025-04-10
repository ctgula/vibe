'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type GuestProfile = {
  id: string;
  name: string;
  avatar_url: string;
};

type UseGuestSessionReturn = {
  guestId: string | null;
  guestProfile: GuestProfile | null;
  isLoading: boolean;
  error: Error | null;
  logout: () => Promise<void>;
  createGuestSession: (username?: string) => Promise<string | null>;
};

export function useGuestSession(): UseGuestSessionReturn {
  const [guestId, setGuestId] = useState<string | null>(null);
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      setSupabase(createBrowserClient(supabaseUrl, supabaseAnonKey));
      
      const storedGuestId = localStorage.getItem('guestProfileId');
      setGuestId(storedGuestId);
    }
  }, []);

  useEffect(() => {
    if (!isClient || !supabase || !guestId) {
      setGuestProfile(null);
      setIsLoading(false);
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
        setIsLoading(false);
      }
    };

    fetchGuestProfile();
  }, [guestId, isClient, supabase]);

  const logout = async () => {
    if (!isClient) return; // Don't run on server
    
    localStorage.removeItem('guestProfileId');
    localStorage.removeItem('guestSessionToken');
    setGuestId(null);
    setGuestProfile(null);
  };

  const createGuestSession = async (username?: string): Promise<string | null> => {
    if (!isClient || !supabase) return null;
    
    try {
      const guestProfileId = crypto.randomUUID();
      
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: guestProfileId,
          username: username || `guest_${Math.floor(Math.random() * 10000)}`,
          display_name: username || `Guest ${Math.floor(Math.random() * 10000)}`,
          is_guest: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error creating guest profile:', error);
        return null;
      }
      
      localStorage.setItem('guestProfileId', guestProfileId);
      setGuestId(guestProfileId);
      
      return guestProfileId;
    } catch (err) {
      console.error('Error creating guest session:', err);
      return null;
    }
  };

  return {
    guestId,
    guestProfile,
    isLoading,
    logout,
    error,
    createGuestSession
  };
}
