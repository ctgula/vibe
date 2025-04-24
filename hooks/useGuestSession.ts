import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface GuestProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  is_guest: boolean;
  onboarding_completed?: boolean;
  created_at: string;
  updated_at: string;
}

export type GuestSession = {
  guestProfile: GuestProfile | null;
  isLoading: boolean;
  error: Error | null;
  createGuestProfile: (name?: string) => Promise<GuestProfile | null>;
  updateGuestProfile: (updates: Partial<GuestProfile>) => Promise<{ success: boolean; error: string | null }>;
};

export function useGuestSession(): GuestSession {
  const [isLoading, setIsLoading] = useState(false);
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient();

  // Always creates a new guest profile (no persistence)
  const createGuestProfile = async (name?: string): Promise<GuestProfile | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const newGuestId = crypto.randomUUID();
      const guestName = name || `Guest ${newGuestId.slice(0, 8)}`;
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: newGuestId,
            full_name: guestName,
            is_guest: true,
            onboarding_completed: false,
            created_at: now,
            updated_at: now
          }
        ])
        .select()
        .single();
      if (error || !data) {
        setError(new Error(error?.message || 'Failed to create guest profile'));
        return null;
      }
      setGuestProfile(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create guest profile'));
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
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', guestProfile.id)
        .eq('is_guest', true);
      if (error) {
        throw new Error(error.message || 'Failed to update guest profile');
      }
      setGuestProfile({ ...guestProfile, ...updates, updated_at: new Date().toISOString() });
      return { success: true, error: null };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error updating guest profile'));
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    guestProfile,
    isLoading,
    error,
    createGuestProfile,
    updateGuestProfile,
  };
}
