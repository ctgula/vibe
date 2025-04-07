'use client';

import { supabase } from '@/lib/supabase';

interface ParticipantOptions {
  is_host?: boolean;
  is_speaker?: boolean;
  is_muted?: boolean;
  has_raised_hand?: boolean;
}

/**
 * Adds a participant to a room, handling both logged-in users and guests
 * This properly handles the conflict case by checking if the participant exists first
 */
export async function addParticipant(
  roomId: string, 
  userId: string | null, 
  guestId: string | null,
  options: ParticipantOptions = {}
) {
  if (!roomId || (!userId && !guestId)) {
    throw new Error('Either userId or guestId is required');
  }

  // Default options
  const participantProps = {
    is_host: options.is_host || false,
    is_speaker: options.is_speaker || options.is_host || false, // Hosts are automatically speakers
    is_muted: options.is_muted !== undefined ? options.is_muted : true,
    has_raised_hand: options.has_raised_hand || false,
  };

  try {
    // First check if the participant already exists
    const { data: existingParticipant, error: checkError } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', roomId)
      .eq(userId ? 'user_id' : 'guest_id', userId || guestId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error("Error checking participant:", checkError);
      throw checkError;
    }

    if (existingParticipant) {
      // Update the existing participant
      const { data, error } = await supabase
        .from('room_participants')
        .update({ 
          ...participantProps,
          is_active: true,
          updated_at: new Date().toISOString() 
        })
        .eq('id', existingParticipant.id)
        .select();
        
      if (error) {
        console.error('Error updating participant:', error);
        throw error;
      }
      
      return data;
    } else {
      // Insert a new participant
      const { data, error } = await supabase
        .from('room_participants')
        .insert([
          { 
            room_id: roomId, 
            user_id: userId, 
            guest_id: guestId,
            ...participantProps,
            is_active: true,
            joined_at: new Date().toISOString()
          }
        ])
        .select();
        
      if (error) {
        console.error('Error adding participant:', error);
        throw error;
      }
      
      return data;
    }
  } catch (error) {
    console.error('Error in addParticipant:', error);
    throw error;
  }
}
