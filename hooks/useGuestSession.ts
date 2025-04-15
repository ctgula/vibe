import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { v4 as uuidv4 } from 'uuid';

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
  const [guestId, setGuestId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const supabase = createClientComponentClient();
  
  // Handle mounting and safely access localStorage
  useEffect(() => {
    setMounted(true);
    
    // Only try to access localStorage if we're in the browser
    if (typeof window !== 'undefined') {
      try {
        // Check for stored guest ID
        const storedGuestId = localStorage.getItem('guestProfileId');
        if (storedGuestId) {
          console.log('Found stored guest ID:', storedGuestId);
          setGuestId(storedGuestId);
        }
      } catch (err) {
        console.error('Error accessing localStorage:', err);
        setError(err instanceof Error ? err : new Error('Failed to access localStorage'));
      }
    }
  }, []);

  // Load guest profile when guestId is available
  useEffect(() => {
    if (!mounted || !guestId) return;
    
    const loadGuestProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Loading guest profile for ID:', guestId);
        
        // Verify the profile exists in the database
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', guestId)
          .eq('is_guest', true)
          .single();

        if (data && !error) {
          console.log('✅ Found existing guest profile:', guestId);
          setGuestProfile(data);
        } else {
          console.log('❌ Guest profile not found or error:', error);
          // Clear invalid guest session
          localStorage.removeItem('guestProfileId');
          localStorage.removeItem('guestSessionToken');
          localStorage.removeItem('guestProfile');
          setGuestId(null);
        }
      } catch (err) {
        console.error('Error fetching guest profile:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch guest profile'));
      } finally {
        setIsLoading(false);
      }
    };

    loadGuestProfile();
  }, [mounted, guestId, supabase]);

  // Create a new guest session
  const createGuestSession = async (username?: string): Promise<GuestProfile | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Generate a new UUID for the guest
      const newGuestId = uuidv4();
      const guestUsername = username || `guest_${Math.random().toString(36).substring(2, 8)}`;
      
      console.log('Creating new guest profile with ID:', newGuestId);
      
      // Create guest profile
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: newGuestId,
            username: guestUsername,
            display_name: `Guest ${guestUsername.substring(6)}`,
            avatar_url: generateAvatarUrl(newGuestId),
            is_guest: true,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
        
      if (error || !data) {
        console.error('Error creating guest profile:', error);
        throw new Error(error?.message || 'Failed to create guest profile');
      }
      
      // Generate and store session token
      const sessionToken = uuidv4();
      localStorage.setItem('guestProfileId', newGuestId);
      localStorage.setItem('guestSessionToken', sessionToken);
      
      // Store the token in Supabase session
      try {
        await supabase.rpc('set_config', { key: 'session_token', value: sessionToken });
        console.log('✅ Guest session token set in Supabase');
      } catch (err) {
        console.warn('Could not set session token in Supabase:', err);
      }
      
      setGuestId(newGuestId);
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
    guestId,
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
