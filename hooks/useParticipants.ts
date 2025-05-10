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
  isActive: boolean;
  isGuest: boolean;
  guestId?: string;
}

export function useParticipants(roomId: string, userId: string, guestId?: string) {
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
      console.log('🔄 Joining room:', { roomId, userId, guestId });
      
      // Check if user is the room creator
      const isCreator = await checkIfRoomCreator();
      console.log('🔍 Is user the room creator?', isCreator);
      
      // Prepare participant data based on creator status
      const participantData = {
        room_id: roomId,
        user_id: userId || null,
        guest_id: guestId || null,
        is_speaker: isCreator, // Automatically make creator a speaker
        is_host: isCreator, // Automatically make creator a host
        has_raised_hand: false,
        is_muted: true, // Start muted by default for safety
        is_active: true, // Mark as active
        joined_at: new Date().toISOString()
      };
      
      const { error: joinError } = await supabase
        .from('room_participants')
        .upsert(
          participantData,
          { onConflict: 'room_id,user_id,guest_id', ignoreDuplicates: false }
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
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .eq('is_active', true); // Only get active participants

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

      const mappedParticipants = data.map((participant) => {
        // Defensive: profiles could be null or an error object
        let name = `User_${(participant.user_id || participant.guest_id).toString().substring(0, 6)}`;
        let avatar = null;
        if (
          participant.profiles &&
          typeof participant.profiles === 'object' &&
          'display_name' in participant.profiles
        ) {
          // @ts-expect-error: dynamic property check
          name = participant.profiles.display_name || participant.profiles.username || name;
          // @ts-expect-error: dynamic property check
          avatar = participant.profiles.avatar_url || null;
        }
        return {
          id: String(participant.user_id || participant.guest_id),
          name,
          avatar,
          isSpeaker: participant.is_speaker || false,
          isMuted: participant.is_muted || false,
          hasRaisedHand: participant.has_raised_hand || false,
          isHost: participant.is_host || false,
          isActive: participant.is_active || false,
          isGuest: false,
        };
      });
      
      console.log('🔄 Mapped participants:', mappedParticipants);
      setParticipants(mappedParticipants);
      
      // Update current user's status
      const userParticipant = data.find(p => p.user_id === userId || p.guest_id === guestId);
      if (userParticipant) {
        // If user is the creator but not marked as host/speaker, update their status
        if (isCreator && (!userParticipant.is_host || !userParticipant.is_speaker)) {
          console.log('🔄 Updating room creator status to host and speaker');
          const participantId = userId || guestId;
          if (participantId) {
            updateParticipantStatus(participantId, {
              is_host: true,
              is_speaker: true
            }, !!guestId);
          }
          
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
  const updateParticipantStatus = async (participantId: string, updates: any, isGuestUser: boolean = false) => {
    try {
      const query = supabase
        .from('room_participants')
        .update(updates)
        .eq('room_id', roomId);
      
      // Add the appropriate filter based on whether it's a guest or regular user
      if (isGuestUser) {
        query.eq('guest_id', participantId);
      } else {
        query.eq('user_id', participantId);
      }
      
      const { error } = await query;
      
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

  // Function to leave the room
  const leaveRoom = async () => {
    try {
      console.log('👋 Leaving room:', { roomId, userId, guestId });
      
      const query = supabase
        .from('room_participants')
        .update({ is_active: false })
        .eq('room_id', roomId);
      
      // Add the appropriate filter based on whether it's a guest or regular user
      if (guestId) {
        query.eq('guest_id', guestId);
      } else {
        query.eq('user_id', userId);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error('❌ Error leaving room:', error);
        throw error;
      }
      
      console.log('✅ Successfully left room');
    } catch (err) {
      console.error('❌ Error leaving room:', err);
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
          
          // Only process if the participant is active
          if (!payload.new.is_active) {
            return;
          }
          
          // Update room activity when a participant joins
          await updateRoomActivity();
          
          // Get the profile data for the new participant
          const fetchNewParticipantProfile = async () => {
            try {
              // Determine if this is a guest or regular user
              const participantId = payload.new.user_id || payload.new.guest_id;
              const isGuestUser = !!payload.new.guest_id;
              
              let profileData = null;
              
              // Only fetch profile data for regular users
              if (!isGuestUser && payload.new.user_id) {
                const { data, error } = await supabase
                  .from('profiles')
                  .select('id, name, avatar_url')
                  .eq('id', payload.new.user_id)
                  .single();
                  
                if (error) {
                  console.error('Error fetching new participant profile:', error);
                } else {
                  profileData = data;
                }
              }
              
              // Add the new participant to the state without refetching all participants
              const newParticipant: Participant = {
                id: participantId,
                name: profileData?.name || `Guest_${participantId.substring(0, 6)}`,
                avatar: profileData?.avatar_url || null,
                isSpeaker: payload.new.is_speaker || false,
                isMuted: payload.new.is_muted || true,
                hasRaisedHand: payload.new.has_raised_hand || false,
                isHost: payload.new.is_host || false,
                isActive: payload.new.is_active || false,
                isGuest: isGuestUser,
                guestId: payload.new.guest_id || undefined
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
          
          // If is_active was changed to false, treat it as a DELETE event
          if (payload.new.is_active === false) {
            console.log('👋 Participant became inactive:', payload);
            
            // Determine the participant ID based on user_id or guest_id
            const participantId = payload.new.user_id || payload.new.guest_id;
            
            // Remove the participant from state
            setParticipants(prev => prev.filter(participant => participant.id !== participantId));
            return;
          }
          
          // Determine the participant ID based on user_id or guest_id
          const participantId = payload.new.user_id || payload.new.guest_id;
          
          // Update the participant in state without refetching all participants
          setParticipants(prev => prev.map(participant => {
            if (participant.id === participantId) {
              return {
                ...participant,
                isSpeaker: payload.new.is_speaker || false,
                isMuted: payload.new.is_muted,
                hasRaisedHand: payload.new.has_raised_hand || false,
                isHost: payload.new.is_host || false,
                isActive: payload.new.is_active || false
              };
            }
            return participant;
          }));
          
          // Update current user's status if it's the user being updated
          // Check if this update is for the current user (either regular user or guest)
          const isCurrentUser = 
            (userId && payload.new.user_id === userId) || 
            (guestId && payload.new.guest_id === guestId);
            
          if (isCurrentUser) {
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
          
          // Remove the participant from state without refetching all participants
          setParticipants(prev => prev.filter(participant => participant.id !== String(payload.old.user_id)));
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
  }, [roomId, userId, guestId]);

  return {
    participants,
    userStatus,
    loading,
    error,
    refetch: fetchParticipants,
    joinRoom,
    leaveRoom,
    updateParticipantStatus
  };
}
