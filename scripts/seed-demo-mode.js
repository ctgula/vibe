// Script to set up a production-ready demo mode with curated content
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client
const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Curated demo guest profiles with stylish avatars
const demoGuests = [
  {
    username: 'alex_design',
    name: 'Alex',
    display_name: 'Alex Chen',
    bio: 'UI/UX designer with a passion for minimalist interfaces',
    avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=alex&backgroundColor=b6e3f4'
  },
  {
    username: 'taylor_swift',
    name: 'Taylor',
    display_name: 'Taylor Swift',
    bio: 'Product manager by day, musician by night',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=taylor&backgroundColor=ffdfbf'
  },
  {
    username: 'dev_ninja',
    name: 'Jordan',
    display_name: 'Jordan Lee',
    bio: 'Full-stack developer specializing in React and Node.js',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=jordan&backgroundColor=d1d4f9'
  },
  {
    username: 'creative_sam',
    name: 'Sam',
    display_name: 'Samantha Wong',
    bio: 'Creative director and design enthusiast',
    avatar_url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=sam&backgroundColor=c0aede'
  },
  {
    username: 'tech_mike',
    name: 'Mike',
    display_name: 'Mike Johnson',
    bio: 'Tech entrepreneur and startup advisor',
    avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=mike&backgroundColor=c1e7e3'
  },
  {
    username: 'data_emma',
    name: 'Emma',
    display_name: 'Emma Garcia',
    bio: 'Data scientist exploring the world of AI and ML',
    avatar_url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=emma&backgroundColor=ffb3ba'
  },
  {
    username: 'product_dave',
    name: 'Dave',
    display_name: 'Dave Smith',
    bio: 'Product strategist focused on user-centered design',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dave&backgroundColor=bae1ff'
  },
  {
    username: 'marketing_lisa',
    name: 'Lisa',
    display_name: 'Lisa Brown',
    bio: 'Digital marketing specialist with a knack for growth hacking',
    avatar_url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=lisa&backgroundColor=ffdfba'
  },
  {
    username: 'ux_research_jay',
    name: 'Jay',
    display_name: 'Jay Patel',
    bio: 'UX researcher passionate about understanding user behavior',
    avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=jay&backgroundColor=baffc9'
  },
  {
    username: 'startup_founder',
    name: 'Olivia',
    display_name: 'Olivia Kim',
    bio: 'Founder of two tech startups and angel investor',
    avatar_url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=olivia&backgroundColor=f4c2c2'
  }
];

// Curated demo rooms with descriptions
const demoRooms = [
  {
    name: 'Product Design Feedback',
    description: 'Share and discuss product designs, get feedback from other designers and product folks',
    is_active: true,
    is_public: true,
    tags: ['design', 'product', 'feedback']
  },
  {
    name: 'Tech Startup Founders',
    description: 'A space for startup founders to connect, share experiences, and help each other grow',
    is_active: true,
    is_public: true,
    tags: ['startup', 'founder', 'entrepreneurship']
  },
  {
    name: 'Frontend Developer Chat',
    description: 'Discuss the latest in frontend development, frameworks, and best practices',
    is_active: true,
    is_public: true,
    tags: ['development', 'frontend', 'javascript']
  }
];

// Curated conversations for each room (realistic back-and-forth)
const roomConversations = {
  'Product Design Feedback': [
    { speaker: 'alex_design', message: "Hey everyone! I just finished a new dashboard design for a finance app. Would love some feedback on the information hierarchy." },
    { speaker: 'creative_sam', message: "I'd be happy to take a look, Alex! What were the main user problems you were trying to solve?" },
    { speaker: 'alex_design', message: "Thanks Sam! The main issue was information overload. Users were getting lost in the data and missing key insights." },
    { speaker: 'product_dave', message: "That's a common problem with finance apps. Did you try using progressive disclosure patterns?" },
    { speaker: 'alex_design', message: "Yes! I implemented a tiered approach where the most important metrics are visible first, with the ability to drill down." },
    { speaker: 'creative_sam', message: "Smart approach. Have you tested it with users yet? I've found that finance power users often want all the data at once." },
    { speaker: 'marketing_lisa', message: "Joining in here - from a marketing perspective, what key actions are you trying to drive with this dashboard?" },
    { speaker: 'alex_design', message: "Great question Lisa. The primary actions are 'review spending categories' and 'set budget alerts'." },
    { speaker: 'ux_research_jay', message: "I've done some research in this space. Users tend to engage more when they see progress toward financial goals visually represented." },
    { speaker: 'product_dave', message: "Absolutely. Gamification elements can increase engagement by up to 30% in finance apps based on studies I've seen." },
    { speaker: 'alex_design', message: "That's really helpful! I'll incorporate more visual progress indicators in the next iteration." },
    { speaker: 'creative_sam', message: "Would love to see the before and after when you make those changes!" }
  ],
  'Tech Startup Founders': [
    { speaker: 'startup_founder', message: "Hi founders! We're about to start our seed funding round. Any advice on the current fundraising climate?" },
    { speaker: 'tech_mike', message: "Olivia, the market is definitely tighter than last year. VCs are focusing more on unit economics and path to profitability." },
    { speaker: 'product_dave', message: "Absolutely. We just closed our seed round last month. Had to demonstrate much clearer traction metrics than friends who raised in 2023." },
    { speaker: 'startup_founder', message: "That's what I'm hearing too. How many investor meetings did it take before you got term sheets?" },
    { speaker: 'tech_mike', message: "We had about 40 meetings for our seed round. Ended up with 3 term sheets. Much different ratio than our pre-seed." },
    { speaker: 'data_emma', message: "Are investors in your space asking about AI strategy? That's been a common question in our pitches." },
    { speaker: 'startup_founder', message: "Every single one! Even though AI isn't core to our product, they all want to know how we're thinking about it." },
    { speaker: 'tech_mike', message: "Pro tip: create a slide specifically addressing your AI roadmap, even if it's not immediate. Helps check that box for investors." },
    { speaker: 'product_dave', message: "Also, don't underestimate the importance of your data strategy. That was a key differentiator for us." },
    { speaker: 'startup_founder', message: "This is super helpful, thanks everyone! Any thoughts on ideal round size in this environment?" },
    { speaker: 'tech_mike', message: "We aimed for 18-24 months of runway. Ended up raising $2.5M on a $10M cap." },
    { speaker: 'data_emma', message: "Similar here. The days of massive seed rounds seem to be paused for now unless you're in a really hot space." }
  ],
  'Frontend Developer Chat': [
    { speaker: 'dev_ninja', message: "What's everyone's take on the React Server Components controversy? Worth adopting now or wait?" },
    { speaker: 'tech_mike', message: "I've been experimenting with RSC in a side project. The mental model shift is significant but I'm seeing performance benefits." },
    { speaker: 'data_emma', message: "We're holding off for now. Our team is still getting comfortable with React 18 features like Suspense." },
    { speaker: 'dev_ninja', message: "That's fair. The ecosystem support is still catching up. Many libraries don't work well with RSC yet." },
    { speaker: 'ux_research_jay', message: "From a UX perspective, I'm excited about the potential for faster initial page loads. Our research shows that's critical for retention." },
    { speaker: 'tech_mike', message: "Exactly. We've seen a 30% improvement in LCP metrics after implementing RSC for our content-heavy pages." },
    { speaker: 'dev_ninja', message: "Are you using Next.js App Router or a different implementation?" },
    { speaker: 'tech_mike', message: "Next.js App Router. The learning curve was steep but the documentation has improved a lot." },
    { speaker: 'data_emma', message: "Has anyone tried Astro for content sites instead? We're considering it as an alternative approach." },
    { speaker: 'dev_ninja', message: "Yes! Astro is fantastic for content-focused sites. The 'islands' architecture gives you the best of both worlds." },
    { speaker: 'tech_mike', message: "Agreed on Astro. If you don't need a lot of client-side interactivity, it's hard to beat for performance." },
    { speaker: 'ux_research_jay', message: "Our dev team just migrated our docs site to Astro and the Lighthouse scores are nearly perfect now." }
  ]
};

// Function to clean up existing demo data
async function cleanupExistingDemoData() {
  try {
    console.log('Cleaning up existing demo data...');
    
    // Delete messages from demo rooms
    const { data: demoRoomsData, error: roomsError } = await supabase
      .from('rooms')
      .select('id')
      .in('name', demoRooms.map(room => room.name));
    
    if (roomsError) {
      throw roomsError;
    }
    
    if (demoRoomsData && demoRoomsData.length > 0) {
      const roomIds = demoRoomsData.map(room => room.id);
      
      // Delete messages from these rooms
      const { error: messagesError } = await supabase
        .from('room_messages')
        .delete()
        .in('room_id', roomIds);
      
      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
      }
      
      // Delete participants from these rooms
      const { error: participantsError } = await supabase
        .from('room_participants')
        .delete()
        .in('room_id', roomIds);
      
      if (participantsError) {
        console.error('Error deleting participants:', participantsError);
      }
      
      // Delete the rooms
      const { error: deleteRoomsError } = await supabase
        .from('rooms')
        .delete()
        .in('id', roomIds);
      
      if (deleteRoomsError) {
        console.error('Error deleting rooms:', deleteRoomsError);
      }
    }
    
    // Delete demo guest profiles
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .in('username', demoGuests.map(guest => guest.username));
    
    if (profilesError) {
      console.error('Error deleting profiles:', profilesError);
    }
    
    console.log('Existing demo data cleaned up');
  } catch (error) {
    console.error('Error cleaning up existing demo data:', error);
  }
}

// Function to create demo guest profiles
async function createDemoGuestProfiles() {
  try {
    console.log('Creating demo guest profiles...');
    
    const profiles = demoGuests.map(guest => ({
      id: uuidv4(),
      username: guest.username,
      name: guest.name,
      display_name: guest.display_name,
      avatar_url: guest.avatar_url,
      bio: guest.bio,
      is_guest: true,
      created_at: new Date().toISOString(),
      updated_at: null
    }));
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(profiles)
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log(`Created ${data.length} demo guest profiles`);
    return data;
  } catch (error) {
    console.error('Error creating demo guest profiles:', error);
    return [];
  }
}

// Function to create demo rooms
async function createDemoRooms(creatorId) {
  try {
    console.log('Creating demo rooms...');
    
    const rooms = demoRooms.map(room => ({
      id: uuidv4(),
      name: room.name,
      description: room.description,
      created_by: creatorId,
      created_by_guest: null,
      is_active: room.is_active,
      is_public: room.is_public,
      tags: room.tags,
      created_at: new Date().toISOString(),
      updated_at: null
    }));
    
    const { data, error } = await supabase
      .from('rooms')
      .insert(rooms)
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log(`Created ${data.length} demo rooms`);
    return data;
  } catch (error) {
    console.error('Error creating demo rooms:', error);
    return [];
  }
}

// Function to add participants to rooms
async function addParticipantsToRooms(rooms, profiles) {
  try {
    console.log('Adding participants to rooms...');
    
    const participants = [];
    
    // For each room, add all profiles as participants
    for (const room of rooms) {
      for (const profile of profiles) {
        participants.push({
          id: uuidv4(),
          room_id: room.id,
          user_id: profile.id,
          guest_id: null,
          is_speaker: Math.random() > 0.3, // 70% chance to be a speaker
          is_host: profile.username === 'alex_design' || profile.username === 'startup_founder' || profile.username === 'dev_ninja',
          is_muted: Math.random() > 0.7, // 30% chance to be muted
          has_raised_hand: false,
          joined_at: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(), // Joined within the last hour
          is_active: true
        });
      }
    }
    
    const { data, error } = await supabase
      .from('room_participants')
      .insert(participants)
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log(`Added ${data.length} participants to rooms`);
    return data;
  } catch (error) {
    console.error('Error adding participants to rooms:', error);
    return [];
  }
}

// Function to add conversations to rooms
async function addConversationsToRooms(rooms, profiles) {
  try {
    console.log('Adding conversations to rooms...');
    
    const messages = [];
    const profileMap = {};
    
    // Create a map of username to profile id
    profiles.forEach(profile => {
      profileMap[profile.username] = profile.id;
    });
    
    // For each room, add the curated conversation
    for (const room of rooms) {
      const roomName = room.name;
      const conversation = roomConversations[roomName] || [];
      
      if (conversation.length === 0) {
        console.log(`No conversation found for room: ${roomName}`);
        continue;
      }
      
      // Base time for the conversation (30-60 minutes ago)
      const baseTime = Date.now() - (30 * 60 * 1000) - Math.floor(Math.random() * 30 * 60 * 1000);
      
      // Add each message with appropriate timing
      conversation.forEach((msg, index) => {
        const speakerId = profileMap[msg.speaker];
        
        if (!speakerId) {
          console.log(`Speaker not found: ${msg.speaker}`);
          return;
        }
        
        // Add some randomness to message timing (1-3 minutes between messages)
        const messageTime = new Date(baseTime + (index * (60000 + Math.floor(Math.random() * 120000)))).toISOString();
        
        messages.push({
          id: uuidv4(),
          room_id: room.id,
          user_id: speakerId,
          content: msg.message,
          created_at: messageTime
        });
      });
    }
    
    // Insert messages in batches to avoid hitting limits
    const batchSize = 50;
    const batches = Math.ceil(messages.length / batchSize);
    
    let insertedCount = 0;
    
    for (let i = 0; i < batches; i++) {
      const batchMessages = messages.slice(i * batchSize, (i + 1) * batchSize);
      
      const { data, error } = await supabase
        .from('room_messages')
        .insert(batchMessages)
        .select();
      
      if (error) {
        console.error(`Error inserting batch ${i + 1}:`, error);
        continue;
      }
      
      insertedCount += data.length;
      console.log(`Inserted batch ${i + 1}: ${data.length} messages`);
    }
    
    console.log(`Added ${insertedCount} messages to rooms`);
    return insertedCount;
  } catch (error) {
    console.error('Error adding conversations to rooms:', error);
    return 0;
  }
}

// Main function to set up demo mode
async function setupDemoMode() {
  try {
    console.log('Setting up demo mode...');
    
    // Clean up existing demo data
    await cleanupExistingDemoData();
    
    // Create demo guest profiles
    const profiles = await createDemoGuestProfiles();
    
    if (!profiles || profiles.length === 0) {
      throw new Error('Failed to create demo profiles');
    }
    
    // Use the first profile as the creator for all rooms
    const creatorId = profiles[0].id;
    
    // Create demo rooms
    const rooms = await createDemoRooms(creatorId);
    
    if (!rooms || rooms.length === 0) {
      throw new Error('Failed to create demo rooms');
    }
    
    // Add participants to rooms
    await addParticipantsToRooms(rooms, profiles);
    
    // Add conversations to rooms
    await addConversationsToRooms(rooms, profiles);
    
    console.log('\nDemo mode setup complete!');
    console.log(`Created ${profiles.length} guest profiles`);
    console.log(`Created ${rooms.length} rooms with curated conversations`);
    
    // Print out a sample guest profile for easy login
    const sampleProfile = profiles[0];
    console.log('\nSample Guest Profile for Testing:');
    console.log(`Username: ${sampleProfile.username}`);
    console.log(`ID: ${sampleProfile.id}`);
    console.log(`Display Name: ${sampleProfile.display_name}`);
    console.log('\nUse this ID with your guest authentication system for testing.');
    
    return {
      success: true,
      profiles,
      rooms
    };
  } catch (error) {
    console.error('Error setting up demo mode:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Check if uuid is installed
async function checkAndInstallDependencies() {
  try {
    require('uuid');
    console.log('UUID is already installed.');
    return true;
  } catch (error) {
    console.log('Installing uuid...');
    const { execSync } = require('child_process');
    try {
      execSync('npm install uuid', { stdio: 'inherit' });
      console.log('UUID installed successfully.');
      return true;
    } catch (installError) {
      console.error('Failed to install uuid:', installError);
      return false;
    }
  }
}

// Run the script
(async () => {
  // Check for dependencies
  const dependenciesInstalled = await checkAndInstallDependencies();
  if (!dependenciesInstalled) {
    console.error('Required dependencies are not installed. Exiting.');
    process.exit(1);
  }
  
  // Set up demo mode
  await setupDemoMode();
})();
