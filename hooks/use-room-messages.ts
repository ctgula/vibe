"use client";

import { useEffect, useState } from "react";
import { supabase, Message, Profile } from "@/lib/supabase";
import { useAuth } from "./use-supabase-auth";

export type MessageWithProfile = Message & {
  profile: Profile;
};

export function useRoomMessages(roomId: string) {
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let messagesSubscription: any;

    async function fetchMessages() {
      try {
        setIsLoading(true);
        
        // Get all messages for the room
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            profile:profiles(*)
          `)
          .eq('room_id', roomId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        setMessages(messagesData);
        setError(null);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();

    // Set up real-time subscription for message updates
    messagesSubscription = supabase
      .channel(`messages-channel-${roomId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, 
        (payload) => {
          // Fetch the new message with profile data
          supabase
            .from('messages')
            .select(`
              *,
              profile:profiles(*)
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data, error }) => {
              if (error) {
                console.error("Error fetching new message:", error);
                return;
              }
              
              // Add the new message to the state
              setMessages(prevMessages => [...prevMessages, data]);
            });
        }
      )
      .subscribe();
    
    return () => {
      // Clean up subscription
      if (messagesSubscription) {
        supabase.removeChannel(messagesSubscription);
      }
    };
  }, [roomId, user?.id]);

  // Send a new message
  const sendMessage = async (content: string) => {
    if (!user) throw new Error("You must be logged in to send messages");
    if (!content.trim()) return;
    
    try {
      // Add haptic feedback for better mobile experience
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([3, 10, 3]);
      }
      
      const { error } = await supabase
        .from('messages')
        .insert([
          { room_id: roomId, profile_id: user.id, content: content.trim() }
        ]);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage
  };
}
