-- Add any missing tables and columns

-- 1. Create activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id),
  user_id UUID REFERENCES auth.users(id),
  guest_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT activity_logs_user_or_guest_check CHECK (
    (user_id IS NOT NULL AND guest_id IS NULL) OR
    (user_id IS NULL AND guest_id IS NOT NULL)
  )
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_room_id ON activity_logs(room_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_guest_id ON activity_logs(guest_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- 3. Add RLS policies for activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
ON activity_logs FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own activity logs"
ON activity_logs FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = guest_id
    AND is_guest = true
  ))
);

-- 4. Add missing columns to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_guest'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_guest BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN display_name TEXT;
  END IF;
END $$;

-- 5. Add missing columns to room_participants table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'room_participants' AND column_name = 'guest_id'
  ) THEN
    ALTER TABLE room_participants ADD COLUMN guest_id UUID REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'room_participants' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE room_participants ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'room_participants' AND column_name = 'has_raised_hand'
  ) THEN
    ALTER TABLE room_participants ADD COLUMN has_raised_hand BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'room_participants' AND column_name = 'is_muted'
  ) THEN
    ALTER TABLE room_participants ADD COLUMN is_muted BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'room_participants' AND column_name = 'is_speaker'
  ) THEN
    ALTER TABLE room_participants ADD COLUMN is_speaker BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'room_participants' AND column_name = 'is_host'
  ) THEN
    ALTER TABLE room_participants ADD COLUMN is_host BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 6. Add missing columns to rooms table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'created_by_guest'
  ) THEN
    ALTER TABLE rooms ADD COLUMN created_by_guest UUID REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE rooms ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'is_private'
  ) THEN
    ALTER TABLE rooms ADD COLUMN is_private BOOLEAN DEFAULT FALSE;
  END IF;
END $$;
