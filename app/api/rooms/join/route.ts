import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const json = await request.json();
    const { room_id } = json;

    if (!room_id) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    // Check if room exists and is active
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', room_id)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Check if user is already in the room
    const { data: existingParticipant, error: participantCheckError } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', room_id)
      .eq('user_id', session.user.id)
      .single();

    if (existingParticipant) {
      // Update the existing participant record
      const { data: updatedParticipant, error: updateError } = await supabase
        .from('room_participants')
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('room_id', room_id)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating participant:', updateError);
        return NextResponse.json(
          { error: 'Failed to update room participant' },
          { status: 500 }
        );
      }

      return NextResponse.json(updatedParticipant);
    }

    // Add new participant to room
    const { data: participant, error: participantError } = await supabase
      .from('room_participants')
      .insert({
        room_id,
        user_id: session.user.id,
        role: 'listener', // Default role
        joined_at: new Date().toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (participantError) {
      console.error('Error adding participant to room:', participantError);
      return NextResponse.json(
        { error: 'Failed to join room' },
        { status: 500 }
      );
    }

    return NextResponse.json(participant);
  } catch (error) {
    console.error('Unexpected error joining room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
