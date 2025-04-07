-- Comprehensive fix for all schema issues

-- Fix the rooms table
DO $$ 
BEGIN
    -- Ensure the rooms table has the necessary columns
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'name'
    ) THEN
        ALTER TABLE rooms ADD COLUMN name TEXT DEFAULT 'New Room';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'title'
    ) THEN
        ALTER TABLE rooms ADD COLUMN title TEXT DEFAULT 'New Room';
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
        WHERE table_name = 'rooms' AND column_name = 'last_active_at'
    ) THEN
        ALTER TABLE rooms ADD COLUMN last_active_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'topics'
    ) THEN
        ALTER TABLE rooms ADD COLUMN topics TEXT[] DEFAULT '{}'::TEXT[];
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'description'
    ) THEN
        ALTER TABLE rooms ADD COLUMN description TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'theme'
    ) THEN
        ALTER TABLE rooms ADD COLUMN theme TEXT DEFAULT 'default';
    END IF;

    -- Fix the profiles table for guest handling
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
        WHERE table_name = 'profiles' AND column_name = 'name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN name TEXT;
    END IF;

    -- Fix the room_participants table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'room_participants'
    ) THEN
        CREATE TABLE room_participants (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
            user_id UUID,
            is_speaker BOOLEAN DEFAULT FALSE,
            is_host BOOLEAN DEFAULT FALSE,
            is_muted BOOLEAN DEFAULT TRUE,
            has_raised_hand BOOLEAN DEFAULT FALSE,
            joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            is_guest BOOLEAN DEFAULT FALSE,
            profile_id UUID,
            UNIQUE(room_id, user_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
        CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);
        
        ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Allow all operations on room_participants"
            ON room_participants FOR ALL
            TO public
            USING (true)
            WITH CHECK (true);
    END IF;

    -- Fix potential FK constraints on profiles table to allow guest IDs
    BEGIN
        -- Try to drop the FK constraint if it exists
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
        EXCEPTION WHEN OTHERS THEN
        -- Constraint might not exist or have a different name, which is fine
    END;
END $$;

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_rooms_id ON rooms(id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_participants_room_id ON participants(room_id);
CREATE INDEX IF NOT EXISTS idx_participants_profile_id ON participants(profile_id);

-- Update policies to allow guest access
DROP POLICY IF EXISTS "Allow all operations on rooms" ON rooms;
CREATE POLICY "Allow all operations on rooms"
    ON rooms FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Add missing columns to existing data
UPDATE rooms 
SET 
    name = COALESCE(name, title, id::text, 'Room ' || gen_random_uuid()::text),
    is_active = COALESCE(is_active, TRUE),
    last_active_at = COALESCE(last_active_at, CURRENT_TIMESTAMP),
    topics = COALESCE(topics, '{}'::TEXT[]),
    description = COALESCE(description, ''),
    theme = COALESCE(theme, 'default')
WHERE TRUE;

-- Update profiles
UPDATE profiles
SET
    name = COALESCE(name, username, full_name, 'User ' || gen_random_uuid()::text),
    is_guest = COALESCE(is_guest, FALSE)
WHERE TRUE;
