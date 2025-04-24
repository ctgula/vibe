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
  const { user } = useAuth();

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching rooms...');
      
      // Get all active rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          participants:room_participants(
            *,
            profile:profiles(*)
          )
        `)
        .eq('is_active', true);

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        throw roomsError;
      }

      console.log('Rooms data:', roomsData);

      // Process the rooms data to get the host and format correctly
      const processedRooms = roomsData.map(room => {
        const participants = room.participants || [];
        const activeParticipants = participants.filter((p: any) => p.is_active === true);
        const hostParticipant = participants.find((p: any) => p.user_id === room.created_by);
        const hostProfile = hostParticipant ? hostParticipant.profile : null;
        
        return {
          ...room,
          participants,
          activeParticipantCount: activeParticipants.length,
          hostProfile
        };
      });

      setRooms(processedRooms);
      setError(null);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();

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
  }, [user?.id]);

  // Create a new room
  const createRoom = async (name: string, description: string, topics: string[] = []) => {
    if (!user) {
      toast.error("You must be logged in to create a room");
      throw new Error("You must be logged in to create a room");
    }
    
    try {
      // Add haptic feedback for better mobile experience
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([3, 10, 3]);
      }
      
      console.log('Creating room:', { name, description, topics, created_by: user.id });
      
      // Insert the room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert([
          { 
            name, 
            description, 
            topics, 
            created_by: user.id,
            is_active: true, 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (roomError) {
        console.error('Error creating room:', roomError);
        throw roomError;
      }
      
      console.log('Room created:', room);
      
      // The trigger should automatically add the creator as a participant
      // But let's fetch the room to be sure
      await fetchRooms();
      
      toast.success("Room created successfully!");
      return room.id;
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error("Failed to create room");
      throw error;
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
