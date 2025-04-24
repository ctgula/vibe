import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // First, check if the room_participants table exists
    const { data: existingTables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'room_participants');
    
    let tableExists = existingTables && existingTables.length > 0;
    console.log("room_participants table exists:", tableExists);
    
    let createdTable = false;
    let addedForeignKeys = false;
    
    // Step 1: Create the table if it doesn't exist
    if (!tableExists) {
      try {
        const { error } = await supabase
          .from('room_participants')
          .insert({
            id: '00000000-0000-0000-0000-000000000000',
            room_id: '00000000-0000-0000-0000-000000000000',
            user_id: '00000000-0000-0000-0000-000000000000',
            is_active: true,
            created_at: new Date().toISOString()
          });
        
        if (error) {
          console.error('Error creating table:', error);
        } else {
          createdTable = true;
          console.log('Created room_participants table');
        }
      } catch (err) {
        console.error('Exception creating table:', err);
      }
    }
    
    // Step 2: Get all rooms to ensure they have participants
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name, created_by')
      .eq('is_active', true);
    
    if (roomsError) {
      console.error('Error fetching rooms:', roomsError);
    } else {
      console.log(`Found ${rooms?.length || 0} active rooms`);
      
      // Create a demo room if none exists
      if (!rooms || rooms.length === 0) {
        // Get a profile to use as owner
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        const ownerId = profiles && profiles.length > 0 
          ? profiles[0].id 
          : '00000000-0000-0000-0000-000000000000';
          
        const { data: newRoom, error: roomError } = await supabase
          .from('rooms')
          .insert({
            name: 'Welcome Room',
            description: 'A place to get started with Vibe',
            created_by: ownerId,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            topics: ['welcome', 'general', 'music']
          })
          .select();
          
        if (roomError) {
          console.error('Error creating demo room:', roomError);
        } else {
          console.log('Created demo room:', newRoom);
          
          // Add room creator as participant
          if (newRoom && newRoom.length > 0) {
            const { error: participantError } = await supabase
              .from('room_participants')
              .insert({
                room_id: newRoom[0].id,
                user_id: ownerId,
                is_active: true,
                created_at: new Date().toISOString()
              });
              
            if (participantError) {
              console.error('Error adding participant:', participantError);
            } else {
              console.log(`Added ${ownerId} as participant to room ${newRoom[0].id}`);
            }
          }
        }
      }
      
      // Ensure all rooms have their creators as participants
      for (const room of rooms || []) {
        const { data: participant, error: participantError } = await supabase
          .from('room_participants')
          .select('id')
          .eq('room_id', room.id)
          .eq('user_id', room.created_by)
          .maybeSingle();
          
        if (participantError) {
          console.error(`Error checking participant for room ${room.id}:`, participantError);
        } else if (!participant) {
          // Add creator as participant
          const { error: insertError } = await supabase
            .from('room_participants')
            .insert({
              room_id: room.id,
              user_id: room.created_by,
              is_active: true,
              created_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error(`Error adding creator as participant for room ${room.id}:`, insertError);
          } else {
            console.log(`Added creator ${room.created_by} as participant for room ${room.id}`);
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Fixed room_participants table and added missing participants',
      tableExisted: tableExists,
      createdTable,
      roomCount: rooms?.length || 0
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error fixing schema',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
