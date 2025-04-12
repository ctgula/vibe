// Script to seed 100+ fake guest users into the profiles table
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

// Generate a random username
function generateUsername() {
  const adjectives = ['happy', 'sunny', 'clever', 'brave', 'mighty', 'gentle', 'wise', 'swift', 'calm', 'bold'];
  const nouns = ['tiger', 'eagle', 'wolf', 'fox', 'panda', 'lion', 'hawk', 'bear', 'deer', 'owl'];
  const adjective = faker.helpers.arrayElement(adjectives);
  const noun = faker.helpers.arrayElement(nouns);
  const number = faker.number.int({ min: 1, max: 999 });
  return `${adjective}_${noun}${number}`;
}

// Generate a random avatar URL (using Dicebear API)
function generateAvatarUrl() {
  const styles = ['adventurer', 'avataaars', 'bottts', 'fun-emoji', 'lorelei', 'micah', 'miniavs', 'open-peeps', 'personas', 'pixel-art'];
  const style = faker.helpers.arrayElement(styles);
  const seed = faker.string.alphanumeric(10);
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

// Main function to seed guest users
async function seedGuestUsers(count = 100) {
  try {
    console.log(`Starting to seed ${count} guest users...`);
    
    const users = [];
    
    // Generate users in batches to avoid rate limiting
    const batchSize = 25;
    const batches = Math.ceil(count / batchSize);
    
    for (let batch = 0; batch < batches; batch++) {
      const batchUsers = [];
      const currentBatchSize = Math.min(batchSize, count - batch * batchSize);
      
      console.log(`Generating batch ${batch + 1}/${batches} (${currentBatchSize} users)...`);
      
      for (let i = 0; i < currentBatchSize; i++) {
        const username = generateUsername();
        const displayName = faker.person.fullName();
        const user = {
          id: uuidv4(),
          username,
          name: displayName.split(' ')[0],
          display_name: displayName,
          avatar_url: generateAvatarUrl(),
          bio: Math.random() > 0.7 ? faker.lorem.sentence(10) : null,
          is_guest: true,
          created_at: new Date().toISOString(),
          updated_at: null
        };
        
        batchUsers.push(user);
      }
      
      // Insert the batch
      const { data, error } = await supabase
        .from('profiles')
        .insert(batchUsers)
        .select();
      
      if (error) {
        console.error(`Error inserting batch ${batch + 1}:`, error);
        continue;
      }
      
      console.log(`Successfully inserted batch ${batch + 1}: ${data.length} users`);
      users.push(...data);
      
      // Wait a bit between batches to avoid rate limiting
      if (batch < batches - 1) {
        console.log('Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Successfully seeded ${users.length} guest users!`);
    console.log('Sample users:');
    users.slice(0, 5).forEach(user => {
      console.log(`- ${user.username} (${user.display_name})`);
    });
    
    return users;
  } catch (error) {
    console.error('Error seeding guest users:', error);
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
  
  // Get the count from command line arguments or default to 100
  const count = process.argv[2] ? parseInt(process.argv[2]) : 100;
  
  // Seed the users
  await seedGuestUsers(count);
})();
