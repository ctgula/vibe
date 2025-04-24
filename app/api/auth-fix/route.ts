import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// This API route provides a way to force-fix authentication issues

export async function GET() {
  // Create a Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Missing Supabase credentials' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const steps = [];
  const errors = [];

  try {
    // 1. Check if the profiles table exists and has the right columns
    try {
      const { data: profilesCheck, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (profilesError) {
        errors.push(`Error checking profiles table: ${profilesError.message}`);
      } else {
        steps.push("Profiles table exists");
      }
    } catch (err) {
      errors.push(`Exception checking profiles table: ${err}`);
    }

    // 2. Reset RLS policies for profiles
    try {
      // Since we can't run raw SQL here, we'll provide the SQL to run
      steps.push("RLS policy reset SQL generated");
    } catch (err) {
      errors.push(`Exception generating RLS policies: ${err}`);
    }

    // 3. Return authentication fix instructions
    const fixInstructions = `
    To fully fix the authentication system:
    
    1. Make sure your .env.local file has the correct Supabase URL and anon key.
    
    2. Run this SQL in your Supabase dashboard:
    
    -- Ensure all required columns exist with proper types
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
    
    -- Create appropriate indexes
    CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
    CREATE INDEX IF NOT EXISTS idx_profiles_is_guest ON profiles(is_guest);
    
    -- Fix Row Level Security
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    -- Fix profiles policies
    DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
    CREATE POLICY "Profiles are viewable by everyone" 
      ON profiles FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
    CREATE POLICY "Users can insert their own profile" 
      ON profiles FOR INSERT WITH CHECK (
        auth.uid() = id 
        OR 
        (is_guest = true AND id IS NOT NULL)
      );
    
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile with guest support" ON profiles;
    CREATE POLICY "Users can update own profile with guest support" 
      ON profiles FOR UPDATE USING (
        auth.uid() = id 
        OR 
        (is_guest = true AND id = id)
      );
    
    3. Create a test user through the Supabase Authentication dashboard and ensure a profile record is created:
    INSERT INTO profiles (id, username, display_name, created_at, updated_at, is_guest) 
    VALUES 
    ('YOUR-USER-ID', 'test_user', 'Test User', NOW(), NOW(), false);
    
    4. After running these steps, restart the Next.js dev server:
    - Stop the current server (Ctrl+C)
    - Run: npm run dev
    `;

    return NextResponse.json({
      success: true,
      completed_steps: steps,
      errors: errors,
      fix_instructions: fixInstructions
    });
  } catch (error: any) {
    console.error('Auth fix error:', error);
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
