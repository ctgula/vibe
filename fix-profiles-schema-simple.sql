-- Drop any existing foreign key constraints
ALTER TABLE IF EXISTS profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Make sure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_guest BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow all operations for public (since we're not using auth)
CREATE POLICY "Allow all operations"
ON profiles FOR ALL
TO public
USING (true)
WITH CHECK (true);
