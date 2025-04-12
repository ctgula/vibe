#!/usr/bin/env node

/**
 * Script to add missing columns to the profiles table
 * This script connects directly to Supabase using the service role key
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateSchema() {
  console.log('🔄 Starting database schema update...');
  
  try {
    // Use the Supabase REST API to execute SQL
    const { data: checkResult, error: checkError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name IN ('avatar_url', 'theme_color');
      `
    });
    
    if (checkError) {
      throw new Error(`Failed to check existing columns: ${checkError.message}`);
    }
    
    const existingColumns = checkResult.map(row => row.column_name);
    console.log('📊 Existing columns:', existingColumns);
    
    // Add avatar_url column if it doesn't exist
    if (!existingColumns.includes('avatar_url')) {
      console.log('➕ Adding avatar_url column to profiles table...');
      const { error: alterError } = await supabase.rpc('execute_sql', {
        query: `
          ALTER TABLE profiles 
          ADD COLUMN avatar_url TEXT;
        `
      });
      
      if (alterError) {
        throw new Error(`Failed to add avatar_url column: ${alterError.message}`);
      }
      
      console.log('✅ avatar_url column added successfully');
    } else {
      console.log('✅ avatar_url column already exists');
    }
    
    // Add theme_color column if it doesn't exist
    if (!existingColumns.includes('theme_color')) {
      console.log('➕ Adding theme_color column to profiles table...');
      const { error: alterError } = await supabase.rpc('execute_sql', {
        query: `
          ALTER TABLE profiles 
          ADD COLUMN theme_color TEXT DEFAULT '#6366f1';
        `
      });
      
      if (alterError) {
        throw new Error(`Failed to add theme_color column: ${alterError.message}`);
      }
      
      console.log('✅ theme_color column added successfully');
    } else {
      console.log('✅ theme_color column already exists');
    }
    
    console.log('🎉 Database schema update completed successfully!');
  } catch (error) {
    console.error('❌ Error updating database schema:', error.message);
    process.exit(1);
  }
}

// Run the update
updateSchema();
