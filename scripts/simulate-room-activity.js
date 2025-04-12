// Script to simulate real-time room activity by inserting messages randomly
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { faker } = require('@faker-js/faker');

// Initialize Supabase client
const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Cache for active rooms and guest profiles
let activeRooms = [];
let guestProfiles = [];

// Sample message templates for more realistic conversations
const messageTemplates = [
  "Hey everyone, how's it going?",
  "I'm new here, what's this room about?",
  "Has anyone tried the new feature?",
  "This is such a great conversation!",
  "I have a question about the topic...",
  "Just joining in to say hello!",
  "What do you all think about this?",
  "I'm enjoying this discussion so far.",
  "Can someone explain how this works?",
  "I've been thinking about this lately...",
  "That's an interesting point!",
  "I agree with what was said earlier.",
  "I'm not sure I understand, can you explain?",
  "Let's talk about something else.",
  "Does anyone have any thoughts on this?",
  "I'm having some technical issues with the audio.",
  "Can everyone hear me okay?",
  "I need to step away for a moment.",
  "I'm back! What did I miss?",
  "This is my first time using this app."
];

// Function to fetch active rooms
async function fetchActiveRooms() {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('id, name')
      .eq('is_active', true);
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('No active rooms found. Please create some rooms first.');
      return [];
    }
    
    console.log(`Found ${data.length} active rooms.`);
    return data;
  } catch (error) {
    console.error('Error fetching active rooms:', error);
    return [];
  }
}

// Function to fetch guest profiles
async function fetchGuestProfiles() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, name, display_name')
      .eq('is_guest', true)
      .limit(20);
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('No guest profiles found. Using fallback profiles.');
      return [
        { id: '9f8e7d6c-5b4a-3c2d-1e0f-9a8b7c6d5e4f', username: 'guest_user1' },
        { id: '8e7d6c5b-4a3c-2d1e-0f9a-8b7c6d5e4f3e', username: 'guest_user2' },
        { id: '7d6c5b4a-3c2d-1e0f-9a8b-7c6d5e4f3e2d', username: 'guest_user3' },
        { id: '6c5b4a3c-2d1e-0f9a-8b7c-6d5e4f3e2d1c', username: 'guest_user4' },
        { id: '5b4a3c2d-1e0f-9a8b-7c6d-5e4f3e2d1c0b', username: 'guest_user5' }
      ];
    }
    
    console.log(`Found ${data.length} guest profiles to use as message authors.`);
    return data;
  } catch (error) {
    console.error('Error fetching guest profiles:', error);
    return [
      { id: '9f8e7d6c-5b4a-3c2d-1e0f-9a8b7c6d5e4f', username: 'guest_user1' },
      { id: '8e7d6c5b-4a3c-2d1e-0f9a-8b7c6d5e4f3e', username: 'guest_user2' },
      { id: '7d6c5b4a-3c2d-1e0f-9a8b-7c6d5e4f3e2d', username: 'guest_user3' },
      { id: '6c5b4a3c-2d1e-0f9a-8b7c-6d5e4f3e2d1c', username: 'guest_user4' },
      { id: '5b4a3c2d-1e0f-9a8b-7c6d-5e4f3e2d1c0b', username: 'guest_user5' }
    ];
  }
}

// Function to generate a random message
function generateRandomMessage() {
  // 80% chance to use a template, 20% chance for completely random message
  if (Math.random() < 0.8) {
    const baseMessage = faker.helpers.arrayElement(messageTemplates);
    // 30% chance to add some additional text
    const additionalText = Math.random() < 0.3 ? ` ${faker.lorem.sentence(3)}` : '';
    return baseMessage + additionalText;
  } else {
    return faker.lorem.sentence(faker.number.int({ min: 3, max: 15 }));
  }
}

// Function to insert a random message into a random room
async function insertRandomMessage() {
  try {
    // Refresh caches if needed
    if (activeRooms.length === 0) {
      activeRooms = await fetchActiveRooms();
      if (activeRooms.length === 0) return false;
    }
    
    if (guestProfiles.length === 0) {
      guestProfiles = await fetchGuestProfiles();
      if (guestProfiles.length === 0) return false;
    }
    
    // Pick a random room and guest profile
    const room = faker.helpers.arrayElement(activeRooms);
    const profile = faker.helpers.arrayElement(guestProfiles);
    
    // Create the message
    const message = {
      room_id: room.id,
      user_id: profile.id,
      content: generateRandomMessage(),
      created_at: new Date().toISOString()
    };
    
    // Insert the message
    const { data, error } = await supabase
      .from('room_messages')
      .insert([message])
      .select();
    
    if (error) {
      console.error('Error inserting message:', error);
      return false;
    }
    
    const displayName = profile.display_name || profile.name || profile.username;
    console.log(`[${new Date().toLocaleTimeString()}] ${displayName} in ${room.name}: ${message.content}`);
    return true;
  } catch (error) {
    console.error('Error in insertRandomMessage:', error);
    return false;
  }
}

// Main function to simulate activity
async function simulateActivity(intervalSeconds = 10, duration = null) {
  console.log(`Starting simulation with ${intervalSeconds} second intervals...`);
  console.log('Press Ctrl+C to stop the simulation.');
  
  // Initial data fetch
  activeRooms = await fetchActiveRooms();
  if (activeRooms.length === 0) {
    console.error('No active rooms found. Exiting.');
    return;
  }
  
  guestProfiles = await fetchGuestProfiles();
  if (guestProfiles.length === 0) {
    console.error('No guest profiles found. Exiting.');
    return;
  }
  
  // Set up interval for message insertion
  let messageCount = 0;
  let successCount = 0;
  
  const intervalId = setInterval(async () => {
    messageCount++;
    
    // Every 10 messages, refresh the room and profile caches
    if (messageCount % 10 === 0) {
      console.log('Refreshing room and profile caches...');
      activeRooms = await fetchActiveRooms();
      guestProfiles = await fetchGuestProfiles();
    }
    
    const success = await insertRandomMessage();
    if (success) successCount++;
    
    // If a duration was specified, check if we've reached it
    if (duration && messageCount * intervalSeconds >= duration) {
      clearInterval(intervalId);
      console.log(`\nSimulation complete. Inserted ${successCount} messages over ${duration} seconds.`);
      process.exit(0);
    }
  }, intervalSeconds * 1000);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(intervalId);
    console.log(`\nSimulation stopped. Inserted ${successCount} messages.`);
    process.exit(0);
  });
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    interval: 10,
    duration: null
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--interval' && i + 1 < args.length) {
      options.interval = parseInt(args[i + 1]);
      i++; // Skip the next argument
    } else if (arg === '--duration' && i + 1 < args.length) {
      options.duration = parseInt(args[i + 1]);
      i++; // Skip the next argument
    }
  }
  
  return options;
}

// Run the script
(async () => {
  const options = parseArgs();
  
  console.log('Options:');
  console.log(`- Message interval: ${options.interval} seconds`);
  console.log(`- Duration: ${options.duration ? options.duration + ' seconds' : 'indefinite (until Ctrl+C)'}`);
  
  // Run the simulation
  await simulateActivity(options.interval, options.duration);
})();
