"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface RoomParticipant {
  id: string;
  room_id: string;
  profile_id: string;
  joined_at: string;
}

interface RoomParticipantCount {
  roomId: string;
  participantCount: number;
}

export const useRoomParticipants = () => {
  const [participantCounts, setParticipantCounts] = useState<RoomParticipantCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial participant counts for active rooms
    const fetchParticipantCounts = async () => {
      setIsLoading(true);
      try {
        // First get active rooms
        const { data: activeRooms, error: roomsError } = await supabase
          .from("rooms")
          .select("id")
          .eq("is_active", true);

        if (roomsError) {
          console.error("[ERROR] Error fetching active rooms:", roomsError);
          setError(roomsError.message);
          return;
        }

        if (!activeRooms || activeRooms.length === 0) {
          setParticipantCounts([]);
          return;
        }

        // Get participants for active rooms
        const { data: participants, error: participantsError } = await supabase
          .from("room_participants")
          .select("room_id")
          .in("room_id", activeRooms.map(room => room.id));

        if (participantsError) {
          console.error("[ERROR] Error fetching participants:", participantsError);
          setError(participantsError.message);
          return;
        }

        // Count participants per room
        const counts = participants?.reduce<Record<string, number>>((acc, participant) => {
          acc[participant.room_id] = (acc[participant.room_id] || 0) + 1;
          return acc;
        }, {});

        // Transform to array format
        const participantCountsArray = activeRooms.map(room => ({
          roomId: room.id,
          participantCount: counts?.[room.id] || 0
        }));

        setParticipantCounts(participantCountsArray);
      } catch (err) {
        console.error("[ERROR] Unexpected error in fetchParticipantCounts:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipantCounts();

    // Set up real-time subscription for room_participants
    const channel = supabase
      .channel("room_participants")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_participants"
        },
        async (payload) => {
          const newParticipant = payload.new as RoomParticipant;
          
          // Check if the room is active before updating counts
          const { data: room } = await supabase
            .from("rooms")
            .select("is_active")
            .eq("id", newParticipant.room_id)
            .single();

          if (room?.is_active) {
            setParticipantCounts((prev) => {
              const existing = prev.find((count) => count.roomId === newParticipant.room_id);
              if (existing) {
                return prev.map((count) =>
                  count.roomId === newParticipant.room_id
                    ? { ...count, participantCount: count.participantCount + 1 }
                    : count
                );
              }
              return [...prev, { roomId: newParticipant.room_id, participantCount: 1 }];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "room_participants"
        },
        async (payload) => {
          const deletedParticipant = payload.old as RoomParticipant;
          
          // Check if the room is active before updating counts
          const { data: room } = await supabase
            .from("rooms")
            .select("is_active")
            .eq("id", deletedParticipant.room_id)
            .single();

          if (room?.is_active) {
            setParticipantCounts((prev) => {
              const existing = prev.find((count) => count.roomId === deletedParticipant.room_id);
              if (existing) {
                const newCount = existing.participantCount - 1;
                if (newCount <= 0) {
                  return prev.filter((count) => count.roomId !== deletedParticipant.room_id);
                }
                return prev.map((count) =>
                  count.roomId === deletedParticipant.room_id
                    ? { ...count, participantCount: newCount }
                    : count
                );
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { participantCounts, isLoading, error };
};
