// Script to delete rooms with no participants and their related messages
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Main function to clean up empty rooms
async function cleanupEmptyRooms(options = {}) {
  const { deleteMessages = true, dryRun = false, olderThanDays = 0 } = options;
  
  try {
    console.log('Starting cleanup of empty rooms...');
    
    // Calculate the cutoff date if olderThanDays is specified
    let cutoffDate = null;
    if (olderThanDays > 0) {
      cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      cutoffDate = cutoffDate.toISOString();
      console.log(`Only considering rooms created before: ${cutoffDate}`);
    }
    
    // Find rooms with no active participants
    console.log('Finding rooms with no active participants...');
    
    // First approach: Get all rooms
    const { data: allRooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name, created_at')
      .eq('is_active', true);
    
    if (roomsError) {
      throw roomsError;
    }
    
    if (!allRooms || allRooms.length === 0) {
      console.log('No active rooms found.');
      return;
    }
    
    console.log(`Found ${allRooms.length} active rooms. Checking for participants...`);
    
    // For each room, check if it has any active participants
    const emptyRooms = [];
    
    for (const room of allRooms) {
      // Skip rooms that are newer than the cutoff date
      if (cutoffDate && room.created_at > cutoffDate) {
        continue;
      }
      
      const { count, error: countError } = await supabase
        .from('room_participants')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id)
        .eq('is_active', true);
      
      if (countError) {
        console.error(`Error checking participants for room ${room.id}:`, countError);
        continue;
      }
      
      if (count === 0) {
        emptyRooms.push(room);
      }
    }
    
    if (emptyRooms.length === 0) {
      console.log('No empty rooms found.');
      return;
    }
    
    console.log(`Found ${emptyRooms.length} empty rooms:`);
    emptyRooms.forEach(room => {
      console.log(`- ${room.name} (${room.id}), created at: ${room.created_at}`);
    });
    
    if (dryRun) {
      console.log('Dry run mode. No rooms will be deleted.');
      return;
    }
    
    // Confirm deletion if running interactively
    if (process.stdin.isTTY && !process.argv.includes('--force')) {
      console.log(`\nWARNING: This will permanently delete ${emptyRooms.length} rooms${deleteMessages ? ' and their messages' : ''}.`);
      console.log('To proceed without confirmation, run with --force flag.');
      console.log('Press Ctrl+C to cancel or Enter to continue...');
      
      // Wait for user input
      await new Promise(resolve => {
        process.stdin.once('data', () => {
          resolve();
        });
      });
    }
    
    // Delete related messages first if requested
    if (deleteMessages) {
      console.log('Deleting messages from empty rooms...');
      
      const roomIds = emptyRooms.map(room => room.id);
      
      // Delete in batches to avoid hitting limits
      const batchSize = 10;
      const batches = Math.ceil(roomIds.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const batchIds = roomIds.slice(i * batchSize, (i + 1) * batchSize);
        
        const { error: messagesError } = await supabase
          .from('room_messages')
          .delete()
          .in('room_id', batchIds);
        
        if (messagesError) {
          console.error(`Error deleting messages for batch ${i + 1}:`, messagesError);
        } else {
          console.log(`Deleted messages for batch ${i + 1} of ${batches}`);
        }
      }
    }
    
    // Delete room participants (even if they're not active)
    console.log('Deleting room participants...');
    
    for (const room of emptyRooms) {
      const { error: participantsError } = await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', room.id);
      
      if (participantsError) {
        console.error(`Error deleting participants for room ${room.id}:`, participantsError);
      }
    }
    
    // Finally, delete the rooms
    console.log('Deleting empty rooms...');
    
    const roomIds = emptyRooms.map(room => room.id);
    
    // Delete in batches to avoid hitting limits
    const batchSize = 10;
    const batches = Math.ceil(roomIds.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const batchIds = roomIds.slice(i * batchSize, (i + 1) * batchSize);
      
      const { error: roomsDeleteError } = await supabase
        .from('rooms')
        .delete()
        .in('id', batchIds);
      
      if (roomsDeleteError) {
        console.error(`Error deleting rooms for batch ${i + 1}:`, roomsDeleteError);
      } else {
        console.log(`Deleted rooms for batch ${i + 1} of ${batches}`);
      }
    }
    
    console.log(`Successfully cleaned up ${emptyRooms.length} empty rooms.`);
    
    // Log the cleanup action to activity_logs if the table exists
    try {
      await supabase
        .from('activity_logs')
        .insert({
          action: 'cleanup_empty_rooms',
          details: { 
            count: emptyRooms.length, 
            deleted_messages: deleteMessages,
            room_ids: roomIds
          },
          created_at: new Date().toISOString()
        });
      console.log('Cleanup action logged to activity_logs.');
    } catch (logError) {
      console.warn('Could not log cleanup action to activity_logs:', logError.message);
    }
    
    return emptyRooms.length;
  } catch (error) {
    console.error('Error cleaning up empty rooms:', error);
    return 0;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    deleteMessages: true,
    dryRun: false,
    olderThanDays: 0
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--no-messages') {
      options.deleteMessages = false;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--older-than' && i + 1 < args.length) {
      options.olderThanDays = parseInt(args[i + 1]);
      i++; // Skip the next argument
    }
  }
  
  return options;
}

// Run the script
(async () => {
  const options = parseArgs();
  
  console.log('Options:');
  console.log(`- Delete messages: ${options.deleteMessages}`);
  console.log(`- Dry run: ${options.dryRun}`);
  console.log(`- Only rooms older than ${options.olderThanDays} days`);
  
  // Run the cleanup
  await cleanupEmptyRooms(options);
})();
