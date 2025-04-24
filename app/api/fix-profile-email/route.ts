import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    instructions: `
    The error "null value in column "email" of relation "profiles" violates not-null constraint" means your email column is set to NOT NULL.
    
    Run this SQL in your Supabase dashboard to fix it:
    
    -- 1. First, make the email column nullable
    ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;
    
    -- 2. Update the profiles schema to match your application needs
    ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS username TEXT,
      ADD COLUMN IF NOT EXISTS display_name TEXT,
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS avatar_url TEXT,
      ADD COLUMN IF NOT EXISTS preferred_genres TEXT[],
      ADD COLUMN IF NOT EXISTS theme_color TEXT,
      ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    
    -- 3. Fix Row Level Security policies
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
    
    -- 4. Alternatively, if you need to create a profile for an existing user:
    INSERT INTO profiles (id, username, display_name, email, created_at, updated_at, is_guest) 
    VALUES 
    ('YOUR-USER-ID', 'test_user', 'Test User', 'your-email@example.com', NOW(), NOW(), false);
    
    After making these changes, restart your Next.js server with 'npm run dev'.
    `
  });
}
