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
    const { room_name, description, is_public = true } = json;

    if (!room_name) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      );
    }

    // Create the room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        name: room_name,
        description,
        is_public,
        created_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (roomError) {
      console.error('Error creating room:', roomError);
      return NextResponse.json(
        { error: 'Failed to create room' },
        { status: 500 }
      );
    }

    // Add creator as host in room_participants
    const { error: participantError } = await supabase
      .from('room_participants')
      .insert({
        room_id: room.id,
        user_id: session.user.id,
        role: 'host',
        joined_at: new Date().toISOString(),
      });

    if (participantError) {
      console.error('Error adding host to room:', participantError);
      // Don't fail the request, but log the error
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error('Unexpected error creating room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
