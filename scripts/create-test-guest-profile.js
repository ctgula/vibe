#!/usr/bin/env node

/**
 * Script to create a test guest profile in the profiles table
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing Supabase credentials in environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestGuestProfile() {
  console.log('🔄 Creating test guest profile...');
  
  try {
    // Check if the profiles table exists
    const { data: tableData, error: tableError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (tableError) {
      if (tableError.code === '42P01') { // relation does not exist
        console.error('❌ The profiles table does not exist. Please create it first.');
        console.log('SQL to create the table:');
        console.log(`
          CREATE TABLE profiles (
            id UUID PRIMARY KEY,
            username TEXT,
            display_name TEXT,
            avatar_url TEXT,
            bio TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_guest BOOLEAN DEFAULT FALSE
          );
        `);
        process.exit(1);
      } else {
        throw new Error(`Failed to check profiles table: ${tableError.message}`);
      }
    }

    // Generate a unique ID for the guest
    const guestId = uuidv4();
    const guestUsername = `guest_${Math.floor(Math.random() * 100000)}`;
    
    // Insert the guest profile
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: guestId,
          username: guestUsername,
          display_name: `Guest ${guestUsername.substring(6)}`,
          avatar_url: `https://ui-avatars.com/api/?name=${guestUsername.charAt(0).toUpperCase()}&background=6366f1&color=fff&size=128`,
          is_guest: true,
          created_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (error) {
      throw new Error(`Failed to create guest profile: ${error.message}`);
    }
    
    console.log('✅ Test guest profile created successfully:');
    console.log(JSON.stringify(data[0], null, 2));
    console.log('\n🔑 Guest ID:', guestId);
    console.log('📝 To use this guest profile in your browser:');
    console.log(`localStorage.setItem('guestProfileId', '${guestId}');`);
    
  } catch (error) {
    console.error('❌ Error creating test guest profile:', error.message);
    process.exit(1);
  }
}

// Run the function
createTestGuestProfile();
