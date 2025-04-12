#!/usr/bin/env node

/**
 * Script to fix the database schema by adding missing columns
 * This script uses the MCP API to execute SQL commands directly
 */

import { executeSQL } from '../lib/mcp-client.js';

async function fixDatabaseSchema() {
  console.log('🔄 Starting database schema fix...');
  
  try {
    // Check if the columns exist
    console.log('🔍 Checking for existing columns...');
    const checkResult = await executeSQL(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name IN ('avatar_url', 'theme_color');
    `);
    
    const existingColumns = checkResult.data.map(row => row.column_name);
    console.log('📊 Existing columns:', existingColumns);
    
    // Add avatar_url column if it doesn't exist
    if (!existingColumns.includes('avatar_url')) {
      console.log('➕ Adding avatar_url column to profiles table...');
      await executeSQL(`
        ALTER TABLE profiles 
        ADD COLUMN avatar_url TEXT;
      `);
      console.log('✅ avatar_url column added successfully');
    } else {
      console.log('✅ avatar_url column already exists');
    }
    
    // Add theme_color column if it doesn't exist
    if (!existingColumns.includes('theme_color')) {
      console.log('➕ Adding theme_color column to profiles table...');
      await executeSQL(`
        ALTER TABLE profiles 
        ADD COLUMN theme_color TEXT DEFAULT '#6366f1';
      `);
      console.log('✅ theme_color column added successfully');
    } else {
      console.log('✅ theme_color column already exists');
    }
    
    console.log('🎉 Database schema fix completed successfully!');
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    process.exit(1);
  }
}

// Run the fix
fixDatabaseSchema();
