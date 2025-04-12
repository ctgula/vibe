import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/hooks/use-supabase-auth';

export interface GuestProfile {
  id: string;
  username?: string;
  display_name?: string;
  name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  is_guest: boolean;
}

// Define the return type for the hook
export type GuestSession = {
  guestId: string | null;
  guestProfile: GuestProfile | null;
  isLoading: boolean;
  error: Error | null;
  createGuestSession: (username?: string) => Promise<GuestProfile | null>;
  updateGuestProfile: (updates: Partial<GuestProfile>) => Promise<{ success: boolean; error: string | null }>;
};

export function useGuestSession(): GuestSession {
  const [isLoading, setIsLoading] = useState(true);
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [mounted, setMounted] = useState(false);
  const supabase = createClientComponentClient();
  
  // Safely access auth context
  const [authState, setAuthState] = useState<{
    guestId: string | null;
    createGuestSession: ((username?: string) => Promise<string | null>) | null;
    profile: any;
    isGuest: boolean;
  }>({
    guestId: null,
    createGuestSession: null,
    profile: null,
    isGuest: false
  });

  // Handle mounting and safely access auth
  useEffect(() => {
    setMounted(true);
    
    // Only try to access auth context if we're in the browser
    if (typeof window !== 'undefined') {
      try {
        const { guestId, createGuestSession, profile, isGuest } = useAuth();
        setAuthState({
          guestId,
          createGuestSession,
          profile,
          isGuest
        });
      } catch (err) {
        console.error('Error accessing auth context:', err);
        setError(err instanceof Error ? err : new Error('Failed to access auth context'));
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const loadGuestProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // If we already have a guest profile from the auth context, use it
        if (authState.isGuest && authState.profile) {
          setGuestProfile(authState.profile);
          setIsLoading(false);
          return;
        }
        
        // Only proceed if we're in the browser
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }
        
        // Check for stored guest ID
        const storedGuestId = localStorage.getItem('guestProfileId');
        
        // If we have a guestId but no profile, try to fetch it
        if (storedGuestId) {
          try {
            // Verify the profile still exists in the database
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', storedGuestId)
              .eq('is_guest', true)
              .single();

            if (data && !error) {
              console.log('✅ Found existing guest profile:', storedGuestId);
              setGuestProfile(data);
            } else {
              console.log('❌ Guest profile not found or error:', error);
              // Clear invalid guest session
              localStorage.removeItem('guestProfileId');
              localStorage.removeItem('guestSessionToken');
              localStorage.removeItem('guestProfile');
            }
          } catch (err) {
            console.error('Error fetching guest profile:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch guest profile'));
          }
        }
      } catch (err) {
        console.error('Unexpected error in loadGuestProfile:', err);
        setError(err instanceof Error ? err : new Error('Unexpected error loading guest profile'));
      } finally {
        setIsLoading(false);
      }
    };

    loadGuestProfile();
  }, [mounted, authState.isGuest, authState.profile]);

  // Create a new guest session
  const createGuestSession = async (username?: string): Promise<GuestProfile | null> => {
    try {
      if (!authState.createGuestSession) {
        throw new Error('Auth system not initialized');
      }
      
      setIsLoading(true);
      setError(null);
      
      // Use the createGuestSession from auth context
      const guestId = await authState.createGuestSession(username);
      
      if (!guestId) {
        throw new Error('Failed to create guest session');
      }
      
      // Fetch the newly created profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', guestId)
        .eq('is_guest', true)
        .single();
        
      if (error || !data) {
        throw new Error(error?.message || 'Failed to fetch guest profile');
      }
      
      setGuestProfile(data);
      return data;
    } catch (err) {
      console.error('Error creating guest session:', err);
      setError(err instanceof Error ? err : new Error('Failed to create guest session'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateGuestProfile = async (updates: Partial<GuestProfile>): Promise<{ success: boolean; error: string | null }> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!guestProfile) {
        throw new Error('Guest profile not found');
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', guestProfile.id)
        .eq('is_guest', true);
        
      if (error) {
        throw new Error(error.message || 'Failed to update guest profile');
      }
      
      // Fetch the updated profile
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', guestProfile.id)
        .eq('is_guest', true)
        .single();
        
      if (fetchError || !updatedProfile) {
        throw new Error(fetchError?.message || 'Failed to fetch updated guest profile');
      }
      
      setGuestProfile(updatedProfile);
      return { success: true, error: null };
    } catch (err) {
      console.error('Error updating guest profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error updating guest profile';
      setError(err instanceof Error ? err : new Error(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    guestId: authState.guestId || localStorage.getItem('guestProfileId'),
    guestProfile,
    isLoading,
    error,
    createGuestSession,
    updateGuestProfile
  };
}

// Helper: Generate a creative guest name
export function generateCreativeGuestName(): string {
  const adjectives = ['Happy', 'Curious', 'Gentle', 'Brave', 'Clever', 'Mighty', 'Swift', 'Calm', 'Wise', 'Bold'];
  const nouns = ['Explorer', 'Voyager', 'Pioneer', 'Wanderer', 'Adventurer', 'Discoverer', 'Seeker', 'Traveler', 'Navigator', 'Pathfinder'];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${randomAdjective}${randomNoun}`;
}

// Helper: Generate an avatar URL
export function generateAvatarUrl(guestId: string): string {
  const colors = ['FF5733', '33FF57', '3357FF', 'FF33F5', 'F5FF33', '33FFF5'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const firstLetter = guestId.charAt(0).toUpperCase();
  
  return `https://ui-avatars.com/api/?name=${firstLetter}&background=${randomColor}&color=fff&size=128`;
}
