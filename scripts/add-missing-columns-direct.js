#!/usr/bin/env node

/**
 * Script to add missing columns to the profiles table
 * This script uses Supabase client's built-in methods instead of custom SQL functions
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
    // First, check if the profiles table exists by trying to get a single row
    const { data: tableCheck, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') { // relation does not exist
      console.log('❌ The profiles table does not exist. Creating it...');
      
      // Create the profiles table with all required columns
      const { error: createError } = await supabase.rpc('rest', {
        method: 'POST',
        path: '/rest/v1/rpc/run_sql',
        body: {
          query: `
            CREATE TABLE IF NOT EXISTS profiles (
              id UUID PRIMARY KEY,
              username TEXT,
              display_name TEXT,
              avatar_url TEXT,
              bio TEXT,
              theme_color TEXT DEFAULT '#6366f1',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              is_guest BOOLEAN DEFAULT FALSE
            );
          `
        }
      });
      
      if (createError) {
        throw new Error(`Failed to create profiles table: ${createError.message}`);
      }
      
      console.log('✅ Profiles table created successfully with all required columns');
      return;
    } else if (tableError) {
      throw new Error(`Error checking profiles table: ${tableError.message}`);
    }
    
    // If we get here, the table exists, so we need to check which columns exist
    console.log('✅ Profiles table exists, checking for missing columns...');
    
    // Get a sample profile to check the schema
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "Results contain 0 rows"
      throw new Error(`Error fetching profile: ${profileError.message}`);
    }
    
    // Check which columns need to be added
    const existingColumns = profile ? Object.keys(profile) : [];
    console.log('📊 Existing columns:', existingColumns);
    
    // Add missing columns using direct SQL through Supabase REST API
    const columnsToAdd = [
      { name: 'avatar_url', type: 'TEXT', default: null },
      { name: 'theme_color', type: 'TEXT', default: "'#6366f1'" },
      { name: 'is_guest', type: 'BOOLEAN', default: 'FALSE' }
    ];
    
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        console.log(`➕ Adding ${column.name} column to profiles table...`);
        
        const defaultClause = column.default ? ` DEFAULT ${column.default}` : '';
        const query = `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}${defaultClause};`;
        
        try {
          // Use the REST API to execute SQL
          const { error } = await supabase.rpc('rest', {
            method: 'POST',
            path: '/rest/v1/rpc/run_sql',
            body: { query }
          });
          
          if (error) {
            // If the REST API fails, try direct SQL through the Postgres extension
            console.log(`⚠️ REST API failed, trying direct SQL through pg_extension...`);
            
            // This is a fallback approach
            const { error: pgError } = await supabase
              .from('_postgres_extension')
              .rpc('sql', { query });
            
            if (pgError) {
              throw new Error(`Failed to add ${column.name} column: ${pgError.message}`);
            }
          }
          
          console.log(`✅ ${column.name} column added successfully`);
        } catch (error) {
          console.error(`❌ Error adding ${column.name} column:`, error.message);
          console.log('⚠️ You may need to add this column manually in the Supabase dashboard.');
          console.log(`SQL: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}${defaultClause};`);
        }
      } else {
        console.log(`✅ ${column.name} column already exists`);
      }
    }
    
    console.log('🎉 Database schema update completed!');
    console.log('');
    console.log('If any columns could not be added automatically, please add them manually');
    console.log('in the Supabase dashboard using the SQL editor with these commands:');
    console.log('');
    console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;');
    console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT \'#6366f1\';');
    console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE;');
    
  } catch (error) {
    console.error('❌ Error updating database schema:', error.message);
    process.exit(1);
  }
}

// Run the update
updateSchema();
