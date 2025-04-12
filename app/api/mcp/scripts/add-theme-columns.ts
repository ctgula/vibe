/**
 * MCP Script to add missing columns to the profiles table
 * This ensures the profiles table has all required columns for the application
 */

import { executeSQL } from '@/lib/mcp-client';

export async function run() {
  console.log('🔄 Starting database schema update...');
  
  try {
    // First check if the columns exist
    const checkResult = await executeSQL(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name IN ('avatar_url', 'theme_color');
    `);
    
    const existingColumns = checkResult.data.map((row: any) => row.column_name);
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
    
    console.log('🎉 Database schema update completed successfully!');
    return { success: true, message: 'Database schema updated successfully' };
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
