// Direct script to interact with Supabase using the provided credentials
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use the environment variables provided
const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  try {
    // Execute a direct SQL query to list tables
    const { data, error } = await supabase
      .rpc('pg_catalog.pg_tables', {
        schemaname: 'public'
      })
      .select('*');

    if (error) {
      // Try an alternative approach with raw SQL
      console.log('Trying alternative approach...');
      
      const { data: rawData, error: rawError } = await supabase
        .from('_rpc')
        .select('*')
        .rpc('pg_catalog.pg_tables', { schemaname: 'public' });
      
      if (rawError) {
        throw rawError;
      }
      
      console.log('Tables in your Supabase project:');
      if (Array.isArray(rawData)) {
        rawData.forEach((table, index) => {
          console.log(`${index + 1}. ${table.tablename}`);
        });
      } else {
        console.log('Unexpected response format:', rawData);
      }
      return;
    }

    console.log('Tables in your Supabase project:');
    if (Array.isArray(data)) {
      data.forEach((table, index) => {
        console.log(`${index + 1}. ${table.tablename}`);
      });
    } else {
      console.log('Unexpected response format:', data);
    }
  } catch (error) {
    console.error('Error listing tables:', error);
    
    // Fallback to hardcoded tables from the database.types.ts file
    console.log('\nFalling back to known tables from your project files:');
    const knownTables = [
      'profiles',
      'rooms',
      'room_participants',
      'room_messages',
      'activity_logs'
    ];
    
    knownTables.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });
  }
}

// Function to create a new room
async function createRoom(roomData) {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .insert([
        {
          name: roomData.name,
          description: roomData.description || null,
          created_by: roomData.created_by || null,
          created_by_guest: roomData.created_by_guest || null,
          is_active: roomData.is_active !== undefined ? roomData.is_active : true,
          is_public: roomData.is_public !== undefined ? roomData.is_public : true,
          tags: roomData.tags || null
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    console.log('Room created successfully:');
    console.log(data);
  } catch (error) {
    console.error('Error creating room:', error);
  }
}

// Execute the function based on command line arguments
const command = process.argv[2];

if (command === 'list-tables') {
  listTables();
} else if (command === 'create-room') {
  const roomName = process.argv[3];
  if (!roomName) {
    console.error('Room name is required');
    process.exit(1);
  }
  
  createRoom({
    name: roomName,
    description: process.argv[4] || 'Created via script',
    created_by_guest: process.argv[5] || null
  });
} else {
  console.log('Available commands:');
  console.log('  list-tables - List all tables in the Supabase project');
  console.log('  create-room [name] [description] [guest_id] - Create a new room');
}
