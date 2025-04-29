"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from "@/hooks/use-supabase-auth";
import { toast } from 'sonner';

const supabase = createClientComponentClient();

// Define types for the DB entities
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  is_guest: boolean;
  theme_color: string | null;
  onboarding_completed: boolean;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  is_active: boolean;
  topics?: string[];
}

export interface Participant {
  id: string;
  room_id: string;
  user_id: string;
  created_at: string;
  is_active: boolean;
  is_speaking?: boolean;
}

export type RoomWithParticipants = Room & {
  participants: (Participant & { profile: Profile })[];
  activeParticipantCount: number;
  hostProfile: Profile | null;
};

export function useRooms() {
  const [rooms, setRooms] = useState<RoomWithParticipants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const { user } = useAuth();

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      setFetchAttempted(true);
      console.log('Fetching rooms...');
      
      // Add a delay to help ensure profile creation has completed
      // This gives time for any profile creation transaction to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Instead of a joined query that's failing, fetch rooms and participants separately
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true);

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        throw roomsError;
      }

      console.log('Rooms data:', roomsData);

      if (!roomsData || roomsData.length === 0) {
        // No rooms available, set empty array and return early
        setRooms([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      // Process each room to get participants separately
      const processedRooms = await Promise.all(roomsData.map(async (room) => {
        // For each room, fetch its participants
        const { data: participants, error: participantsError } = await supabase
          .from('room_participants')
          .select(`
            *,
            profile:profiles(*)
          `)
          .eq('room_id', room.id);
          
        if (participantsError) {
          console.error(`Error fetching participants for room ${room.id}:`, participantsError);
          return {
            ...room,
            participants: [],
            activeParticipantCount: 0,
            hostProfile: null
          };
        }
        
        // Filter active participants and find host
        const activeParticipants = participants?.filter(p => p.is_active === true) || [];
        
        // Find the host profile - try direct method first
        let hostProfile = null;
        
        // Get profile for the room creator
        if (room.created_by) {
          const { data: directHostProfile, error: hostProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', room.created_by)
            .maybeSingle();
            
          if (!hostProfileError && directHostProfile) {
            hostProfile = directHostProfile;
          } else {
            // Fallback to getting from participants
            const hostParticipant = participants?.find(p => p.user_id === room.created_by);
            hostProfile = hostParticipant ? hostParticipant.profile : null;
          }
        }
        
        return {
          ...room,
          participants: participants || [],
          activeParticipantCount: activeParticipants.length,
          hostProfile
        };
      }));

      setRooms(processedRooms);
      setError(null);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Set empty rooms array to prevent endless loading state
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createRoom = async (name: string, description: string, topics: string[] = []) => {
    // Only allow authenticated users (no more guest users)
    if (!user?.id) {
      toast.error('You must be logged in to create a room');
      return null;
    }

    try {
      setIsLoading(true);
      console.log('Creating room with user ID:', user.id);

      // 1. First create the room
      const { data: newRoom, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name,
          description,
          created_by: user.id,
          is_active: true,
          topics,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (roomError) {
        console.error('Error creating room:', roomError);
        toast.error('Failed to create room: ' + roomError.message);
        throw roomError;
      }

      console.log('Room created successfully:', newRoom);

      // 2. Manually add the creator as a participant since the trigger might not work
      const { error: participantError } = await supabase
        .from('room_participants')
        .insert({
          room_id: newRoom.id,
          user_id: user.id,
          is_active: true,
          created_at: new Date().toISOString()
        });

      if (participantError) {
        console.error('Error adding creator as participant:', participantError);
        // Continue anyway, we still created the room
      } else {
        console.log('Added room creator as participant');
      }

      // 3. Fetch the user profile to attach to the room
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      }

      // 4. Create a processed room with participants
      const processedRoom: RoomWithParticipants = {
        ...newRoom,
        participants: [{
          id: crypto.randomUUID(), // Temporary ID for the participant
          room_id: newRoom.id,
          user_id: user.id,
          created_at: new Date().toISOString(),
          is_active: true,
          is_speaking: false,
          profile: userProfile || null
        }],
        activeParticipantCount: 1,
        hostProfile: userProfile || null
      };

      // 5. Add this new room to the state
      setRooms(prev => [processedRoom, ...prev]);
      
      toast.success('Room created!');
      return processedRoom;
    } catch (err) {
      console.error('Error in createRoom:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Join a room as a participant
  const joinRoom = async (roomId: string) => {
    if (!user) {
      toast.error("You must be logged in to join a room");
      throw new Error("You must be logged in to join a room");
    }
    
    try {
      // Add haptic feedback for better mobile experience
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(3);
      }
      
      console.log('Joining room:', roomId);
      
      // Check if the user is already a participant
      const { data: existingParticipant, error: checkError } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking participant:', checkError);
        throw checkError;
      }
      
      if (existingParticipant) {
        // If already a participant, just set is_active to true
        const { error: updateError } = await supabase
          .from('room_participants')
          .update({ is_active: true })
          .eq('id', existingParticipant.id);
        
        if (updateError) {
          console.error('Error updating participant:', updateError);
          throw updateError;
        }
      } else {
        // If not a participant, insert a new record
        const { error: insertError } = await supabase
          .from('room_participants')
          .insert([
            {
              room_id: roomId,
              user_id: user.id,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ]);
        
        if (insertError) {
          console.error('Error adding participant:', insertError);
          throw insertError;
        }
      }
      
      toast.success("Joined room successfully!");
      return roomId;
    } catch (error) {
      console.error("Error joining room:", error);
      toast.error("Failed to join room");
      throw error;
    }
  };
  
  // Leave a room
  const leaveRoom = async (roomId: string) => {
    if (!user) return;
    
    try {
      // Add haptic feedback for better mobile experience
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(3);
      }
      
      console.log('Leaving room:', roomId);
      
      const { error } = await supabase
        .from('room_participants')
        .update({ is_active: false })
        .eq('room_id', roomId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error leaving room:', error);
        throw error;
      }
      
      toast.success("Left room successfully");
    } catch (error) {
      console.error("Error leaving room:", error);
      toast.error("Failed to leave room");
      throw error;
    }
  };

  useEffect(() => {
    // Only fetch on initial render or if user changes
    if (user?.id && (!fetchAttempted || rooms.length === 0)) {
      fetchRooms();
    }

    // Set up real-time subscription for room updates
    const roomsSubscription = supabase
      .channel('rooms-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rooms' }, 
        (payload) => {
          console.log('Room change detected:', payload);
          // Refresh all rooms when there's a change
          fetchRooms();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'room_participants' }, 
        (payload) => {
          console.log('Room participant change detected:', payload);
          // Refresh all rooms when there's a participant change
          fetchRooms();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload: any) => {
          // Important: Also refresh rooms when profiles change
          // This handles the case where a profile is created after signup
          console.log('Profile change detected:', payload);
          if (user?.id && payload.new && user.id === payload.new.id) {
            console.log('User profile updated, refreshing rooms');
            fetchRooms();
          }
        }
      )
      .subscribe((status, error) => {
        if (error) {
          console.error('Subscription error:', error);
        }
        console.log('Subscription status:', status);
      });
    
    return () => {
      // Clean up subscription
      if (roomsSubscription) {
        supabase.removeChannel(roomsSubscription);
      }
    };
  }, [user?.id, fetchAttempted, rooms.length]);

  return {
    rooms,
    isLoading,
    error,
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom
  };
}
