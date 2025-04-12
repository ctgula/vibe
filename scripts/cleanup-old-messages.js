// Script to delete room messages older than 30 days
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

// Function to calculate the date X days ago
function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

// Main function to clean up old messages
async function cleanupOldMessages(daysOld = 30) {
  try {
    console.log(`Starting cleanup of messages older than ${daysOld} days...`);
    
    // Calculate the cutoff date
    const cutoffDate = getDateDaysAgo(daysOld);
    console.log(`Cutoff date: ${cutoffDate}`);
    
    // First, count how many messages will be deleted
    const { count, error: countError } = await supabase
      .from('room_messages')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', cutoffDate);
    
    if (countError) {
      throw countError;
    }
    
    if (count === 0) {
      console.log('No messages found older than the cutoff date.');
      return 0;
    }
    
    console.log(`Found ${count} messages to delete.`);
    
    // Confirm deletion if running interactively
    if (process.stdin.isTTY && !process.argv.includes('--force')) {
      console.log(`\nWARNING: This will permanently delete ${count} messages.`);
      console.log('To proceed without confirmation, run with --force flag.');
      console.log('Press Ctrl+C to cancel or Enter to continue...');
      
      // Wait for user input
      await new Promise(resolve => {
        process.stdin.once('data', () => {
          resolve();
        });
      });
    }
    
    // Delete the messages
    console.log('Deleting messages...');
    const { error: deleteError } = await supabase
      .from('room_messages')
      .delete()
      .lt('created_at', cutoffDate);
    
    if (deleteError) {
      throw deleteError;
    }
    
    console.log(`Successfully deleted ${count} messages older than ${daysOld} days.`);
    
    // Log the cleanup action to activity_logs if the table exists
    try {
      await supabase
        .from('activity_logs')
        .insert({
          action: 'cleanup_old_messages',
          details: { count, days_old: daysOld, cutoff_date: cutoffDate },
          created_at: new Date().toISOString()
        });
      console.log('Cleanup action logged to activity_logs.');
    } catch (logError) {
      console.warn('Could not log cleanup action to activity_logs:', logError.message);
    }
    
    return count;
  } catch (error) {
    console.error('Error cleaning up old messages:', error);
    return 0;
  }
}

// Run the script
(async () => {
  // Get the days from command line arguments or default to 30
  const days = process.argv[2] ? parseInt(process.argv[2]) : 30;
  const forceFlag = process.argv.includes('--force');
  
  if (forceFlag) {
    console.log('Force flag detected. Proceeding without confirmation.');
  }
  
  // Run the cleanup
  await cleanupOldMessages(days);
})();
