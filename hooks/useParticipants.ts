import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Participant {
  id: string;
  name: string;
  avatar: string | null;
  isSpeaker: boolean;
  isMuted: boolean;
  hasRaisedHand: boolean;
  isHost: boolean;
  isActive?: boolean;
}

export function useParticipants(roomId: string, userId: string) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState({
    isSpeaker: false,
    isMuted: true,
    hasRaisedHand: false,
    isHost: false
  });

  const joinRoom = async () => {
    try {
      console.log('🔄 Joining room as listener:', { roomId, userId });
      
      const { error: joinError } = await supabase
        .from('room_participants')
        .upsert(
          {
            room_id: roomId,
            user_id: userId,
            is_speaker: false,
            has_raised_hand: false,
            is_muted: true,
            joined_at: new Date().toISOString()
          },
          { onConflict: 'room_id,user_id', ignoreDuplicates: false }
        );

      if (joinError) {
        console.error('❌ Error joining room:', joinError);
        throw joinError;
      }
      
      console.log('✅ Successfully joined room');
      
      // Refresh participant list after joining
      fetchParticipants();
    } catch (err) {
      console.error('❌ Error joining room:', err);
    }
  };

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching participants for room:', roomId);
      
      const { data, error } = await supabase
        .from('room_participants')
        .select(`
          *,
          profiles (
            id,
            name,
            avatar_url
          )
        `)
        .eq('room_id', roomId);

      if (error) {
        console.error('❌ Error fetching participants:', error);
        setError(error.message);
        setLoading(false);
        return;
      }

      console.log('📊 Participants data:', data);
      
      if (!data || data.length === 0) {
        console.log('👥 No participants found in room');
        setParticipants([]);
        setLoading(false);
        
        // Auto-join as a listener if not already in the room
        joinRoom();
        return;
      }

      const mappedParticipants = data.map((participant) => ({
        id: participant.user_id,
        name: participant.profiles?.name || `Guest_${participant.user_id.substring(0, 6)}`,
        avatar: participant.profiles?.avatar_url || null,
        isSpeaker: participant.is_speaker || false,
        isMuted: participant.is_muted || false,
        hasRaisedHand: participant.has_raised_hand || false,
        isHost: participant.is_host || false,
        isActive: false, // Default to inactive
      }));
      
      console.log('🔄 Mapped participants:', mappedParticipants);
      setParticipants(mappedParticipants);
      
      // Update current user's status
      const userParticipant = data.find(p => p.user_id === userId);
      if (userParticipant) {
        setUserStatus({
          isSpeaker: userParticipant.is_speaker || false,
          isMuted: userParticipant.is_muted || true,
          hasRaisedHand: userParticipant.has_raised_hand || false,
          isHost: userParticipant.is_host || false
        });
      } else {
        // Auto-join as a listener if not already in the room
        joinRoom();
      }
    } catch (err: any) {
      console.error('❌ Error in fetchParticipants:', err);
      setError(err.message || 'An error occurred fetching participants');
    } finally {
      setLoading(false);
    }
  };

  // Function to update room's last_active_at timestamp
  const updateRoomActivity = async () => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', roomId);
      
      if (error) {
        console.error('Error updating room activity:', error);
      }
    } catch (err) {
      console.error('Failed to update room activity:', err);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchParticipants();

    // Create a channel specifically for this room
    const roomChannel = supabase
      .channel(`room-${roomId}-participants`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'room_participants', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          console.log('👋 New participant joined:', payload);
          
          // Update room activity when a participant joins
          await updateRoomActivity();
          
          // Get the profile data for the new participant
          const fetchNewParticipantProfile = async () => {
            try {
              const { data, error } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .eq('id', payload.new.user_id)
                .single();
                
              if (error) {
                console.error('Error fetching new participant profile:', error);
                return;
              }
              
              // Add the new participant to the state without refetching all participants
              const newParticipant: Participant = {
                id: payload.new.user_id,
                name: data?.name || `Guest_${payload.new.user_id.substring(0, 6)}`,
                avatar: data?.avatar_url || null,
                isSpeaker: payload.new.is_speaker || false,
                isMuted: payload.new.is_muted || true,
                hasRaisedHand: payload.new.has_raised_hand || false,
                isHost: payload.new.is_host || false,
                isActive: false
              };
              
              setParticipants(prev => {
                // Check if participant already exists to avoid duplicates
                const exists = prev.some(p => p.id === newParticipant.id);
                if (exists) return prev;
                return [...prev, newParticipant];
              });
            } catch (err) {
              console.error('Error processing new participant:', err);
            }
          };
          
          fetchNewParticipantProfile();
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'room_participants', filter: `room_id=eq.${roomId}` },
        (payload) => {
          console.log('🔄 Participant updated:', payload);
          
          // Update the participant in state without refetching all participants
          setParticipants(prev => prev.map(participant => {
            if (participant.id === payload.new.user_id) {
              return {
                ...participant,
                isSpeaker: payload.new.is_speaker || false,
                isMuted: payload.new.is_muted || true,
                hasRaisedHand: payload.new.has_raised_hand || false,
                isHost: payload.new.is_host || false
              };
            }
            return participant;
          }));
          
          // Update current user's status if it's the user being updated
          if (payload.new.user_id === userId) {
            setUserStatus({
              isSpeaker: payload.new.is_speaker || false,
              isMuted: payload.new.is_muted || true,
              hasRaisedHand: payload.new.has_raised_hand || false,
              isHost: payload.new.is_host || false
            });
          }
        }
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'room_participants', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          console.log('👋 Participant left:', payload);
          
          // Update room activity when a participant leaves
          await updateRoomActivity();
          
          // Remove the participant from state without refetching all participants
          setParticipants(prev => prev.filter(participant => participant.id !== payload.old.user_id));
        }
      )
      .subscribe((status) => {
        console.log(`Room ${roomId} subscription status:`, status);
      });

    // Cleanup function to unsubscribe when component unmounts or roomId changes
    return () => {
      console.log(`Unsubscribing from room ${roomId} participants channel`);
      roomChannel.unsubscribe();
    };
  }, [roomId, userId]);

  return {
    participants,
    userStatus,
    loading,
    error,
    refetch: fetchParticipants,
    joinRoom
  };
}
