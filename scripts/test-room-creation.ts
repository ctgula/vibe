const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestRoom() {
  try {
    // First, let's get a real user from the database to use as creator
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (userError || !users || users.length === 0) {
      throw new Error('No users found in the database');
    }

    const creatorId = users[0].id;
    console.log('Using creator ID:', creatorId);

    // Create the room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert([
        {
          name: 'Test Room from Script',
          created_by: creatorId,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (roomError) {
      throw roomError;
    }

    console.log('Successfully created room:', room);

    // Add the creator as a room participant (host)
    const { data: participant, error: participantError } = await supabase
      .from('room_participants')
      .insert([
        {
          room_id: room.id,
          user_id: creatorId,
          is_active: true,
          joined_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (participantError) {
      throw participantError;
    }

    console.log('Added creator as room participant:', participant);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

createTestRoom();
