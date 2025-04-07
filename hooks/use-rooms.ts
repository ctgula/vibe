"use client";

import { useEffect, useState } from "react";
import { supabase, Room, Participant, Profile } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { addParticipant } from "@/utils/participants";

export type RoomWithParticipants = Room & {
  participants: (Participant & { profile: Profile })[];
  hostProfile: Profile | null;
};

export function useRooms() {
  const [rooms, setRooms] = useState<RoomWithParticipants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user, guestId, isGuest } = useAuth();

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
            participants:room_participants(
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
  }, [user?.id, guestId]);

  // Create a new room
  const createRoom = async (name: string, description: string, topics: string[] = []) => {
    if (!user && !guestId) throw new Error("You must be logged in or in guest mode to create a room");
    
    try {
      // Add haptic feedback for better mobile experience
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([3, 10, 3]);
      }
      
      // Insert the room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert([
          { 
            name, 
            description, 
            topics, 
            created_by: user?.id || null,
            created_by_guest: !user ? guestId : null,
            is_public: true,
            is_active: true,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (roomError) throw roomError;
      
      // Add creator as host using the utility function
      await addParticipant(room.id, user?.id || null, !user ? guestId : null, {
        is_host: true,
        is_speaker: true,
        is_muted: false
      });
      
      // Store room creator info in localStorage
      localStorage.setItem("isHost", "true");
      localStorage.setItem("roomId", room.id);
      
      return room.id;
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  };
  
  // Join a room as a listener
  const joinRoom = async (roomId: string) => {
    if (!user && !guestId) throw new Error("You must be logged in or in guest mode to join a room");
    
    try {
      // Add haptic feedback for better mobile experience
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(3);
      }
      
      await addParticipant(roomId, user?.id || null, !user ? guestId : null);
      
      return roomId;
    } catch (error) {
      console.error("❌ Error joining room:", error);
      throw error;
    }
  };
  
  // Leave a room
  const leaveRoom = async (roomId: string) => {
    if (!user && !guestId) return;
    
    try {
      // Add haptic feedback for better mobile experience
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(3);
      }
      
      const { error } = await supabase
        .from('room_participants')
        .update({ is_active: false })
        .match({ 
          room_id: roomId, 
          ...(user ? { user_id: user.id } : { guest_id: guestId })
        });
      
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
