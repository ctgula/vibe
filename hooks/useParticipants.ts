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

  // Check if the user is the room creator
  const checkIfRoomCreator = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('created_by')
        .eq('id', roomId)
        .single();
      
      if (error) {
        console.error('❌ Error checking room creator:', error);
        return false;
      }
      
      return data?.created_by === userId;
    } catch (err) {
      console.error('❌ Error checking room creator:', err);
      return false;
    }
  };

  const joinRoom = async () => {
    try {
      console.log('🔄 Joining room:', { roomId, userId });
      
      // Check if user is the room creator
      const isCreator = await checkIfRoomCreator();
      console.log('🔍 Is user the room creator?', isCreator);
      
      // Prepare participant data based on creator status
      const participantData = {
        room_id: roomId,
        user_id: userId,
        is_speaker: isCreator, // Automatically make creator a speaker
        is_host: isCreator, // Automatically make creator a host
        has_raised_hand: false,
        is_muted: true, // Start muted by default for safety
        joined_at: new Date().toISOString()
      };
      
      const { error: joinError } = await supabase
        .from('room_participants')
        .upsert(
          participantData,
          { onConflict: 'room_id,user_id', ignoreDuplicates: false }
        );

      if (joinError) {
        console.error('❌ Error joining room:', joinError);
        throw joinError;
      }
      
      console.log('✅ Successfully joined room with data:', participantData);
      
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
      
      // First check if user is the room creator
      const isCreator = await checkIfRoomCreator();
      console.log('🔍 Is user the room creator?', isCreator);
      
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
        // If user is the creator but not marked as host/speaker, update their status
        if (isCreator && (!userParticipant.is_host || !userParticipant.is_speaker)) {
          console.log('🔄 Updating room creator status to host and speaker');
          updateParticipantStatus(userId, {
            is_host: true,
            is_speaker: true
          });
          
          // Update local state immediately for better UX
          setUserStatus({
            isSpeaker: true,
            isMuted: userParticipant.is_muted || true,
            hasRaisedHand: userParticipant.has_raised_hand || false,
            isHost: true
          });
        } else {
          setUserStatus({
            isSpeaker: userParticipant.is_speaker || false,
            isMuted: userParticipant.is_muted || true,
            hasRaisedHand: userParticipant.has_raised_hand || false,
            isHost: userParticipant.is_host || false
          });
        }
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

  // Function to update a participant's status
  const updateParticipantStatus = async (participantId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('room_participants')
        .update(updates)
        .eq('room_id', roomId)
        .eq('user_id', participantId);
      
      if (error) {
        console.error('❌ Error updating participant status:', error);
        throw error;
      }
      
      console.log('✅ Successfully updated participant status:', { participantId, ...updates });
    } catch (err) {
      console.error('❌ Error updating participant status:', err);
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
                isMuted: payload.new.is_muted,
                hasRaisedHand: payload.new.has_raised_hand || false,
                isHost: payload.new.is_host || false
              };
            }
            return participant;
          }));
          
          // Update current user's status if it's the user being updated
          // But don't override mute state if this update was triggered by another user's action
          if (payload.new.user_id === userId) {
            // Only update the user's own mute state if the change was made by the user
            // This prevents the mute state from being overridden by other participants' updates
            const currentUserStatus = { ...userStatus };
            
            // Always update these properties
            currentUserStatus.isSpeaker = payload.new.is_speaker || false;
            currentUserStatus.hasRaisedHand = payload.new.has_raised_hand || false;
            currentUserStatus.isHost = payload.new.is_host || false;
            
            // Only update mute state if it's different from what we already have
            // This prevents the UI from flickering between states
            if (currentUserStatus.isMuted !== payload.new.is_muted) {
              currentUserStatus.isMuted = payload.new.is_muted;
            }
            
            setUserStatus(currentUserStatus);
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
    joinRoom,
    updateParticipantStatus
  };
}
