// Script to insert 5 fake messages into each active room in Supabase
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

// First, get some guest profiles to use as message authors
async function getGuestProfiles() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, name')
      .eq('is_guest', true)
      .limit(5);
    
    if (error) {
      console.error('Error fetching guest profiles:', error);
      // Fallback to generated profiles if we can't fetch real ones
      return [
        { id: '9f8e7d6c-5b4a-3c2d-1e0f-9a8b7c6d5e4f', username: 'guest_user1' },
        { id: '8e7d6c5b-4a3c-2d1e-0f9a-8b7c6d5e4f3e', username: 'guest_user2' },
        { id: '7d6c5b4a-3c2d-1e0f-9a8b-7c6d5e4f3e2d', username: 'guest_user3' },
        { id: '6c5b4a3c-2d1e-0f9a-8b7c-6d5e4f3e2d1c', username: 'guest_user4' },
        { id: '5b4a3c2d-1e0f-9a8b-7c6d-5e4f3e2d1c0b', username: 'guest_user5' }
      ];
    }
    
    if (!data || data.length === 0) {
      console.log('No guest profiles found, creating fallback profiles');
      return [
        { id: '9f8e7d6c-5b4a-3c2d-1e0f-9a8b7c6d5e4f', username: 'guest_user1' },
        { id: '8e7d6c5b-4a3c-2d1e-0f9a-8b7c6d5e4f3e', username: 'guest_user2' },
        { id: '7d6c5b4a-3c2d-1e0f-9a8b-7c6d5e4f3e2d', username: 'guest_user3' },
        { id: '6c5b4a3c-2d1e-0f9a-8b7c-6d5e4f3e2d1c', username: 'guest_user4' },
        { id: '5b4a3c2d-1e0f-9a8b-7c6d-5e4f3e2d1c0b', username: 'guest_user5' }
      ];
    }
    
    console.log(`Found ${data.length} guest profiles to use as message authors`);
    return data;
  } catch (error) {
    console.error('Error in getGuestProfiles:', error);
    return [
      { id: '9f8e7d6c-5b4a-3c2d-1e0f-9a8b7c6d5e4f', username: 'guest_user1' },
      { id: '8e7d6c5b-4a3c-2d1e-0f9a-8b7c6d5e4f3e', username: 'guest_user2' },
      { id: '7d6c5b4a-3c2d-1e0f-9a8b-7c6d5e4f3e2d', username: 'guest_user3' },
      { id: '6c5b4a3c-2d1e-0f9a-8b7c-6d5e4f3e2d1c', username: 'guest_user4' },
      { id: '5b4a3c2d-1e0f-9a8b-7c6d-5e4f3e2d1c0b', username: 'guest_user5' }
    ];
  }
}

// Sample message templates
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
  "I've been thinking about this lately..."
];

// Function to generate a random message
function generateRandomMessage() {
  const baseMessage = faker.helpers.arrayElement(messageTemplates);
  const additionalText = Math.random() > 0.5 ? ` ${faker.lorem.sentence(3)}` : '';
  return baseMessage + additionalText;
}

// Function to get a random profile from the list
function getRandomProfile(profiles) {
  return faker.helpers.arrayElement(profiles);
}

// Main function to insert sample messages
async function insertSampleMessages() {
  try {
    // First get guest profiles to use as authors
    const guestProfiles = await getGuestProfiles();
    
    console.log('Fetching active rooms...');
    
    // Get all active rooms
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name')
      .eq('is_active', true);
    
    if (roomsError) {
      throw roomsError;
    }
    
    if (!rooms || rooms.length === 0) {
      console.log('No active rooms found.');
      return;
    }
    
    console.log(`Found ${rooms.length} active rooms.`);
    
    // For each room, insert 5 sample messages
    for (const room of rooms) {
      console.log(`Inserting messages for room: ${room.name} (${room.id})`);
      
      const messages = [];
      
      // Create 5 messages for this room
      for (let i = 0; i < 5; i++) {
        const profile = getRandomProfile(guestProfiles);
        const message = {
          room_id: room.id,
          user_id: profile.id, // Using the user_id field instead of guest_id
          content: generateRandomMessage(),
          created_at: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString() // Random time in the last 24 hours
        };
        messages.push(message);
      }
      
      // Insert the messages
      const { data: insertedMessages, error: insertError } = await supabase
        .from('room_messages')
        .insert(messages)
        .select();
      
      if (insertError) {
        console.error(`Error inserting messages for room ${room.id}:`, insertError);
        continue;
      }
      
      console.log(`Successfully inserted ${insertedMessages ? insertedMessages.length : 0} messages for room ${room.name}`);
    }
    
    console.log('Sample message insertion complete!');
  } catch (error) {
    console.error('Error inserting sample messages:', error);
  }
}

// Run the script
(async () => {
  await insertSampleMessages();
})();
