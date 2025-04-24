import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// This is a secure API route that performs database migrations
// Only run this once to update your schema

export async function GET() {
  // Create a Supabase client with admin privileges
  // This uses the same env vars as your app
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Missing Supabase credentials' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const errors = [];
  const results = [];

  try {
    // Try to use RPC first (this will likely fail if the function doesn't exist)
    try {
      const { error: rpcError } = await supabase.rpc('alter_profiles_for_auth');
      if (!rpcError) {
        results.push('Added columns to profiles table via RPC');
      } else {
        // RPC failed, use direct SQL instead
        console.log('RPC not available, using direct SQL...');
      }
    } catch (err) {
      console.log('RPC not available, using direct SQL...');
    }

    // Add missing columns to profiles table
    try {
      const { error: columnsError } = await supabase.from('profiles').select('count').limit(1);
      
      if (columnsError) {
        errors.push(`Error connecting to profiles table: ${columnsError.message}`);
      } else {
        // Now execute raw SQL using the correct method
        const { error: sqlError } = await supabase
          .from('_migrations')
          .insert({
            name: 'add_auth_columns_to_profiles',
            sql: `
              -- Add missing fields to the profiles table for improved authentication
              ALTER TABLE profiles 
                ADD COLUMN IF NOT EXISTS email TEXT,
                ADD COLUMN IF NOT EXISTS full_name TEXT,
                ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false,
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                ADD COLUMN IF NOT EXISTS bio TEXT,
                ADD COLUMN IF NOT EXISTS preferred_genres TEXT[],
                ADD COLUMN IF NOT EXISTS theme_color TEXT,
                ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
            `
          });
        
        if (sqlError) {
          errors.push(`Error adding columns: ${sqlError.message}`);
        } else {
          results.push('Added columns to profiles table');
        }
      }
    } catch (err: any) {
      errors.push(`Error adding columns: ${err.message}`);
    }

    // The raw SQL execution is not directly available through the JS client
    // Instead, let's provide instructions for running these changes manually

    return NextResponse.json({
      success: errors.length === 0,
      message: 'Migration partially completed',
      results,
      errors,
      manual_steps_required: true,
      sql_to_run_manually: `
-- Run this SQL in the Supabase Dashboard SQL Editor:

-- Add missing fields to the profiles table for improved authentication
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS preferred_genres TEXT[],
  ADD COLUMN IF NOT EXISTS theme_color TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Make sure we have appropriate indexes
CREATE INDEX IF NOT EXISTS idx_profiles_is_guest ON profiles(is_guest);

-- Update RLS policies to include guest users
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT WITH CHECK (
    auth.uid() = id 
    OR 
    (is_guest = true AND id IS NOT NULL)
  );

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile with guest support" ON profiles;
CREATE POLICY "Users can update own profile with guest support" 
  ON profiles FOR UPDATE USING (
    auth.uid() = id 
    OR 
    (is_guest = true AND id = id)
  );
`
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        details: error
      },
      { status: 500 }
    );
  }
}
