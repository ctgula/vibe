'use client';

import { useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { supabase } from '@/lib/supabase';

export function useRoomNotifications(roomId?: string) {
  const { addNotification } = useNotification();

  useEffect(() => {
    // Subscribe to participant joins
    const participantJoinChannel = supabase
      .channel('participant-joins')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'room_participants',
        filter: roomId ? `room_id=eq.${roomId}` : undefined
      }, (payload) => {
        const participant = payload.new as any;
        
        // Fetch the participant's name
        supabase
          .from('profiles')
          .select('username')
          .eq('id', participant.user_id)
          .single()
          .then(({ data }) => {
            const username = data?.username || 'Someone';
            addNotification(`${username} joined the room`, 'info');
          });
      })
      .subscribe();

    // Subscribe to hand raise events
    const handRaiseChannel = supabase
      .channel('hand-raise-events')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'room_participants',
        filter: roomId 
          ? `room_id=eq.${roomId} and has_raised_hand=eq.true` 
          : 'has_raised_hand=eq.true'
      }, (payload) => {
        const participant = payload.new as any;
        const oldParticipant = payload.old as any;
        
        // Only notify if hand was just raised (changed from false to true)
        if (participant.has_raised_hand && !oldParticipant.has_raised_hand) {
          // Fetch the participant's name
          supabase
            .from('profiles')
            .select('username')
            .eq('id', participant.user_id)
            .single()
            .then(({ data }) => {
              const username = data?.username || 'Someone';
              addNotification(`${username} raised their hand`, 'info');
            });
        }
      })
      .subscribe();

    // Subscribe to speaker promotions
    const speakerPromotionChannel = supabase
      .channel('speaker-promotions')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'room_participants',
        filter: roomId 
          ? `room_id=eq.${roomId} and is_speaker=eq.true` 
          : 'is_speaker=eq.true'
      }, (payload) => {
        const participant = payload.new as any;
        const oldParticipant = payload.old as any;
        
        // Only notify if the participant was promoted from listener to speaker
        if (participant.is_speaker && !oldParticipant.is_speaker) {
          // Fetch the participant's name
          supabase
            .from('profiles')
            .select('username')
            .eq('id', participant.user_id)
            .single()
            .then(({ data }) => {
              const username = data?.username || 'Someone';
              addNotification(`${username} is now a speaker`, 'success');
            });
        }
      })
      .subscribe();
      
    // Subscribe to mute/unmute events
    const muteChannel = supabase
      .channel('mute-events')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'room_participants',
        filter: roomId ? `room_id=eq.${roomId}` : undefined
      }, (payload) => {
        const participant = payload.new as any;
        const oldParticipant = payload.old as any;
        
        // Only notify if mute status changed and the participant is a speaker
        if (participant.is_speaker && participant.is_muted !== oldParticipant.is_muted) {
          // Fetch the participant's name
          supabase
            .from('profiles')
            .select('username')
            .eq('id', participant.user_id)
            .single()
            .then(({ data }) => {
              const username = data?.username || 'Someone';
              const status = participant.is_muted ? 'muted' : 'unmuted';
              addNotification(`${username} ${status} their microphone`, 'info');
            });
        }
      })
      .subscribe();

    // Subscribe to new messages
    const messageChannel = supabase
      .channel('message-events')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'room_messages',
        filter: roomId ? `room_id=eq.${roomId}` : undefined
      }, (payload) => {
        const message = payload.new as any;
        
        // Fetch the sender's name
        supabase
          .from('profiles')
          .select('username')
          .eq('id', message.user_id)
          .single()
          .then(({ data }) => {
            const username = data?.username || 'Someone';
            addNotification(`New message from ${username}`, 'info', 3000);
          });
      })
      .subscribe();

    return () => {
      participantJoinChannel.unsubscribe();
      handRaiseChannel.unsubscribe();
      speakerPromotionChannel.unsubscribe();
      muteChannel.unsubscribe();
      messageChannel.unsubscribe();
    };
  }, [roomId, addNotification]);
}

export function useGlobalNotifications() {
  const { addNotification } = useNotification();

  useEffect(() => {
    // Subscribe to new room creations
    const newRoomChannel = supabase
      .channel('new-room-events')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'rooms' 
      }, (payload) => {
        const newRoom = payload.new as any;
        addNotification(`New room created: ${newRoom.name}`, 'info');
      })
      .subscribe();
      
    // Subscribe to room updates (title changes, etc)
    const roomUpdateChannel = supabase
      .channel('room-update-events')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'rooms' 
      }, (payload) => {
        const room = payload.new as any;
        const oldRoom = payload.old as any;
        
        // Only notify if the room name changed
        if (room.name !== oldRoom.name) {
          addNotification(`Room renamed to: ${room.name}`, 'info');
        }
      })
      .subscribe();

    return () => {
      newRoomChannel.unsubscribe();
      roomUpdateChannel.unsubscribe();
    };
  }, [addNotification]);
}
