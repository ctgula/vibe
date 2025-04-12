#!/usr/bin/env node

/**
 * Script to check the profiles table schema
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

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

async function checkSchema() {
  console.log('🔍 Checking profiles table schema...');
  
  try {
    // Get a sample profile to check schema
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      throw new Error(`Failed to fetch profiles: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️ No profiles found in the database');
      return;
    }
    
    // Check the schema
    const profile = data[0];
    console.log('📊 Profile schema:');
    console.log(JSON.stringify(profile, null, 2));
    
    // Check if is_guest column exists
    if ('is_guest' in profile) {
      console.log('✅ is_guest column exists in profiles table');
    } else {
      console.log('❌ is_guest column is missing from profiles table');
      console.log('Please add the is_guest column to the profiles table in Supabase');
    }
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    process.exit(1);
  }
}

// Run the check
checkSchema();
