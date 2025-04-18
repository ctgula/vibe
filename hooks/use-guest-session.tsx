import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase'; // Assuming this client is appropriate
import { useRouter } from 'next/navigation';
import { useAuth, Profile } from './use-supabase-auth'; // Import useAuth and Profile type

// Keep Profile interface aligned or import from use-supabase-auth
// Re-exporting Profile might be cleaner if needed elsewhere
// export type { Profile } from './use-supabase-auth';

interface UseGuestSessionReturn {
  // guestProfile is now available via useAuth().profile
  isLoading: boolean; // Reflect auth loading state
  error: Error | null; // Keep local error state for guest actions
  createGuestRoom: (roomName?: string) => Promise<{ roomId: string } | null>; // Can return null on error
  joinRoomAsGuest: (roomId: string) => Promise<void>;
  clearGuestSession: () => Promise<void>; // Make async if calling async auth methods
  ensureGuestProfile: () => Promise<Profile | null>; // Helper to ensure guest profile exists
}

export function useGuestSession(): UseGuestSessionReturn {
  const { 
    profile: authProfile, 
    isLoading: authLoading, 
    setProfile: setAuthProfile, 
    signOut 
  } = useAuth();
  const router = useRouter();
  // Keep local error state specific to guest actions
  const [error, setError] = useState<Error | null>(null);
  // Add specific loading state for guest actions if needed, distinct from authLoading
  const [isActionLoading, setIsActionLoading] = useState(false);

  // No need for useEffect to load profile, useAuth handles it.

  // Renamed to ensureGuestProfile for clarity
  const ensureGuestProfile = useCallback(async (): Promise<Profile | null> => {
    // If a profile exists in auth context (user or guest), return it
    if (authProfile) {
        // Optional: Could add a check here if !authProfile.is_guest if specific guest actions are needed
        return authProfile;
    }

    // Check local storage again in case auth context hasn't updated yet
    const storedGuestId = localStorage.getItem('guestProfileId');
    if (storedGuestId) {
        // Attempt to load profile if stored ID exists but context is empty
        // This might indicate a state mismatch, useAuth should ideally handle this
        try {
            setIsActionLoading(true);
            const { data: loadedProfile, error: loadError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', storedGuestId)
                .single();
            if (loadError) throw loadError;
            if (loadedProfile) {
                setAuthProfile(loadedProfile); // Update auth context
                return loadedProfile;
            }
        } catch (err) {
            console.error('Error re-loading guest profile from storage:', err);
            localStorage.removeItem('guestProfileId'); // Clear invalid ID
            // Fall through to create a new one
        } finally {
            setIsActionLoading(false);
        }
    }

    // No profile in context or storage, create a new one
    const guestId = uuidv4();
    const guestUsername = `guest_${guestId.slice(0, 8)}`;
    console.log('Creating new guest profile:', guestUsername);

    try {
      setIsActionLoading(true);
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: guestId,
          username: guestUsername,
          display_name: 'Guest User',
          is_guest: true,
          // avatar_url: null, // Default is null
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString() // Add updated_at on creation
        })
        .select('*') // Select all columns including defaults
        .single();

      if (insertError) throw insertError;

      if (newProfile) {
          console.log('New guest profile created:', newProfile);
          localStorage.setItem('guestProfileId', guestId);
          setAuthProfile(newProfile); // Update the central auth state
          return newProfile;
      } else {
          throw new Error('Failed to retrieve newly created guest profile.');
      }
    } catch (err: any) {
      console.error('Failed to create guest profile:', err);
      setError(err);
      return null; // Indicate failure
    } finally {
      setIsActionLoading(false);
    }
  }, [authProfile, setAuthProfile]); // Dependencies on auth context

  const createGuestRoom = async (roomName: string = 'Vibe Lounge'): Promise<{ roomId: string } | null> => {
    setError(null);
    setIsActionLoading(true);

    try {
      const currentProfile = await ensureGuestProfile();
      if (!currentProfile) {
          throw new Error('Could not ensure guest profile for room creation.');
      }

      const roomId = uuidv4();
      console.log(`Creating guest room '${roomName}' by ${currentProfile.id}`);

      // Create the room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          id: roomId,
          room_name: roomName,
          created_by: currentProfile.id, // Use the ensured profile ID
          is_live: true,
          // enable_video: false // Rely on default value
        })
        .select('id') // Select only needed column
        .single();

      if (roomError) throw roomError;
      if (!room) throw new Error('Failed to retrieve created room ID.');

      console.log('Room created:', room.id);

      // Add guest as room participant
      const { error: participantError } = await supabase
        .from('room_participants')
        .insert({
          room_id: room.id,
          user_id: currentProfile.id, // Use the ensured profile ID
          is_speaker: true,
          // has_raised_hand: false, // Rely on default value
          // is_muted: false, // Rely on default value
          // is_active: true // Add if column exists and is required
        });

      if (participantError) throw participantError;

      console.log('Guest participant added to room:', room.id);
      return { roomId: room.id };

    } catch (err: any) {
      console.error('Error creating guest room:', err);
      setError(err);
      return null; // Indicate failure
    } finally {
      setIsActionLoading(false);
    }
  };

  const joinRoomAsGuest = async (roomId: string): Promise<void> => {
    setError(null);
    setIsActionLoading(true);

    try {
      const currentProfile = await ensureGuestProfile();
      if (!currentProfile) {
        throw new Error('Could not ensure guest profile for joining room.');
      }

      console.log(`Guest ${currentProfile.id} joining room ${roomId}`);

      const { error: participantError } = await supabase
        .from('room_participants')
        .insert({
          room_id: roomId,
          user_id: currentProfile.id, // Use the ensured profile ID
          // is_speaker: false, // Rely on default
          // has_raised_hand: false, // Rely on default
          // is_muted: true // Set explicit default for non-speakers?
          // is_active: true // Add if column exists and is required
        });

      if (participantError) {
           // Handle potential duplicate entry (e.g., guest already in room)
           if (participantError.code === '23505') { // Check for unique constraint violation code
               console.warn(`Guest ${currentProfile.id} already in room ${roomId}`);
           } else {
               throw participantError;
           }
       }
       console.log(`Guest ${currentProfile.id} joined room ${roomId} successfully (or was already present).`);

    } catch (err: any) {
      console.error('Error joining room as guest:', err);
      setError(err);
      // Decide if error should be re-thrown based on UI needs
      // throw err; 
    } finally {
      setIsActionLoading(false);
    }
  };

  const clearGuestSession = async (): Promise<void> => {
    console.log('Clearing guest session (calling signOut)...');
    setError(null);
    // SignOut in useAuth should handle clearing localStorage and context state
    await signOut();
  };

  return {
    // Profile is now obtained via useAuth()
    isLoading: authLoading || isActionLoading, // Combine loading states
    error,
    createGuestRoom,
    joinRoomAsGuest,
    clearGuestSession,
    ensureGuestProfile
  };
}
