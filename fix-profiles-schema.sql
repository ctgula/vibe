-- Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_guest boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow public access for now
CREATE POLICY "Allow public access to profiles"
ON profiles FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Create index on id
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);

-- Update foreign key constraints
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_created_by_fkey;
ALTER TABLE rooms ADD CONSTRAINT rooms_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

ALTER TABLE room_participants DROP CONSTRAINT IF EXISTS room_participants_user_id_fkey;
ALTER TABLE room_participants ADD CONSTRAINT room_participants_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;
