import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// This API route will provide the SQL needed to fix your schema

export async function GET() {
  // Create the SQL needed to fix the profiles table
  const migrationSQL = `
-- Fix profiles table schema to match application requirements
-- First, let's ensure the required columns exist
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS preferred_genres TEXT[],
  ADD COLUMN IF NOT EXISTS theme_color TEXT,
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Remove the UNIQUE constraint from username if it exists
-- (This is tricky and might require recreating the column, but we'll leave this step for manual handling if needed)

-- Make sure we have appropriate indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_guest ON profiles(is_guest);

-- Update RLS policies to support proper access
-- Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Ensure view access for everyone
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

-- Update insert policy for both authenticated and guest users
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT WITH CHECK (
    auth.uid() = id 
    OR 
    (is_guest = true AND id IS NOT NULL)
  );

-- Update policy for profile updates
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile with guest support" ON profiles;
CREATE POLICY "Users can update own profile with guest support" 
  ON profiles FOR UPDATE USING (
    auth.uid() = id 
    OR 
    (is_guest = true AND id = id)
  );

-- Finally let's check for any missing foreign key constraints or relations
-- that might be causing issues (this is informational, not executed automatically)
  `;

  // Return the SQL to execute for fixing the schema
  return NextResponse.json({
    success: true,
    title: "Schema Fix Instructions",
    message: "Run this SQL in your Supabase SQL Editor to fix the missing columns issue",
    sql: migrationSQL
  });
}
