import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface GuestProfile {
  id: string;
  username: string;
  display_name: string;
  is_guest: boolean;
  avatar_url: string | null;
  created_at: string;
}

interface UseGuestSessionReturn {
  guestProfile: GuestProfile | null;
  isLoading: boolean;
  error: Error | null;
  createGuestRoom: (roomName?: string) => Promise<{ roomId: string }>;
  joinRoomAsGuest: (roomId: string) => Promise<void>;
  clearGuestSession: () => void;
}

export function useGuestSession(): UseGuestSessionReturn {
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedGuestId = localStorage.getItem('guestProfileId');
    if (storedGuestId) {
      loadGuestProfile(storedGuestId);
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadGuestProfile = async (guestId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', guestId)
        .single();

      if (error) throw error;
      if (profile) setGuestProfile(profile);
    } catch (err) {
      console.error('Error loading guest profile:', err);
      localStorage.removeItem('guestProfileId');
    } finally {
      setIsLoading(false);
    }
  };

  const createOrGetGuestProfile = async () => {
    if (guestProfile) return guestProfile;

    const guestId = uuidv4();
    const guestUsername = `guest_${guestId.slice(0, 8)}`;
    
    try {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: guestId,
          username: guestUsername,
          display_name: 'Guest User',
          is_guest: true,
          avatar_url: null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      localStorage.setItem('guestProfileId', guestId);
      setGuestProfile(newProfile);
      return newProfile;
    } catch (err) {
      console.error('Failed to create guest profile:', err);
      throw new Error('Failed to create guest profile');
    }
  };

  const createGuestRoom = async (roomName: string = 'Vibe Lounge') => {
    setError(null);
    setIsLoading(true);

    try {
      const guestProfile = await createOrGetGuestProfile();
      const roomId = uuidv4();

      // Create the room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          id: roomId,
          room_name: roomName,
          created_by: guestProfile.id,
          is_live: true,
          enable_video: false
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add guest as room participant
      const { error: participantError } = await supabase
        .from('room_participants')
        .insert({
          room_id: room.id,
          user_id: guestProfile.id,
          is_speaker: true,
          has_raised_hand: false,
          is_muted: false
        });

      if (participantError) throw participantError;

      return { roomId: room.id };
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoomAsGuest = async (roomId: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const guestProfile = await createOrGetGuestProfile();

      const { error: participantError } = await supabase
        .from('room_participants')
        .insert({
          room_id: roomId,
          user_id: guestProfile.id,
          is_speaker: false,
          has_raised_hand: false,
          is_muted: true
        });

      if (participantError) throw participantError;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearGuestSession = () => {
    localStorage.removeItem('guestProfileId');
    setGuestProfile(null);
  };

  return {
    guestProfile,
    isLoading,
    error,
    createGuestRoom,
    joinRoomAsGuest,
    clearGuestSession
  };
}
