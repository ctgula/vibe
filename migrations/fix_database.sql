-- Add is_active column to room_participants if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'room_participants' 
                  AND column_name = 'is_active') THEN
        ALTER TABLE room_participants ADD COLUMN is_active boolean DEFAULT true;
    END IF;
END $$;

-- Ensure profiles table has required columns
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' 
                  AND column_name = 'display_name') THEN
        ALTER TABLE profiles ADD COLUMN display_name text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' 
                  AND column_name = 'username') THEN
        ALTER TABLE profiles ADD COLUMN username text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' 
                  AND column_name = 'is_guest') THEN
        ALTER TABLE profiles ADD COLUMN is_guest boolean DEFAULT false;
    END IF;
END $$;

-- Create or update realtime publication for room_participants
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'room_participants_pub') THEN
        CREATE PUBLICATION room_participants_pub FOR TABLE room_participants;
    ELSE
        ALTER PUBLICATION room_participants_pub SET TABLE room_participants;
    END IF;
END $$;

-- Create necessary indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_profile_id ON room_participants(profile_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_is_active ON room_participants(is_active);

-- Update any stale room_participants records
UPDATE room_participants 
SET is_active = false 
WHERE is_active IS NULL;
