"use client";

import { useEffect, useState } from "react";
import { supabase, Room, Participant, Profile } from "@/lib/supabase";
import { useAuth } from "./use-supabase-auth";

export type RoomWithParticipants = Room & {
  participants: (Participant & { profile: Profile })[];
  hostProfile: Profile | null;
};

export function useRooms() {
  const [rooms, setRooms] = useState<RoomWithParticipants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let roomsSubscription: any;

    async function fetchRooms() {
      try {
        setIsLoading(true);
        
        // Get all active rooms
        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select(`
            *,
            participants:participants(
              *,
              profile:profiles(*)
            )
          `)
          .eq('is_live', true);

        if (roomsError) throw roomsError;

        // Process the rooms data to get the host and format correctly
        const processedRooms = roomsData.map(room => {
          const participants = room.participants || [];
          const hostParticipant = participants.find((p: any) => p.role === 'host');
          const hostProfile = hostParticipant ? hostParticipant.profile : null;
          
          return {
            ...room,
            participants,
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
    }

    fetchRooms();

    // Set up real-time subscription for room updates
    roomsSubscription = supabase
      .channel('rooms-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rooms' }, 
        (payload) => {
          // Refresh all rooms when there's a change
          fetchRooms();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'participants' }, 
        (payload) => {
          // Refresh all rooms when there's a participant change
          fetchRooms();
        }
      )
      .subscribe();
    
    return () => {
      // Clean up subscription
      if (roomsSubscription) {
        supabase.removeChannel(roomsSubscription);
      }
    };
  }, [user?.id]);

  // Create a new room
  const createRoom = async (name: string, description: string, topics: string[] = []) => {
    if (!user) throw new Error("You must be logged in to create a room");
    
    try {
      // Add haptic feedback for better mobile experience
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([3, 10, 3]);
      }
      
      // Insert the room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert([
          { name, description, topics, created_by: user.id }
        ])
        .select()
        .single();
      
      if (roomError) throw roomError;
      
      // Add creator as host
      const { error: participantError } = await supabase
        .from('participants')
        .insert([
          { room_id: room.id, profile_id: user.id, role: 'host', is_muted: false }
        ]);
      
      if (participantError) throw participantError;
      
      return room.id;
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  };
  
  // Join a room as a listener
  const joinRoom = async (roomId: string) => {
    if (!user) throw new Error("You must be logged in to join a room");
    
    try {
      // Add haptic feedback for better mobile experience
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(3);
      }
      
      const { error } = await supabase
        .from('participants')
        .upsert([
          { 
            room_id: roomId, 
            profile_id: user.id, 
            role: 'listener',
            is_muted: true,
            hand_raised: false,
            joined_at: new Date().toISOString()
          }
        ], {
          onConflict: 'room_id,profile_id',
          ignoreDuplicates: false
        });
      
      if (error) throw error;
      
      return roomId;
    } catch (error) {
      console.error("Error joining room:", error);
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
      
      const { error } = await supabase
        .from('participants')
        .delete()
        .match({ room_id: roomId, profile_id: user.id });
      
      if (error) throw error;
    } catch (error) {
      console.error("Error leaving room:", error);
      throw error;
    }
  };

  return {
    rooms,
    isLoading,
    error,
    createRoom,
    joinRoom,
    leaveRoom
  };
}
