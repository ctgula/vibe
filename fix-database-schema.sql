-- Fix the rooms table schema issues
DO $$ 
BEGIN
    -- Check if the name column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'name'
    ) THEN
        ALTER TABLE rooms ADD COLUMN name TEXT;
    END IF;

    -- Check if the is_active column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE rooms ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    -- Check for room_participants table (needed for directory page)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'room_participants'
    ) THEN
        -- Create room_participants table if it doesn't exist
        CREATE TABLE room_participants (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
            user_id UUID,
            is_speaker BOOLEAN DEFAULT FALSE,
            is_host BOOLEAN DEFAULT FALSE,
            is_muted BOOLEAN DEFAULT TRUE,
            has_raised_hand BOOLEAN DEFAULT FALSE,
            joined_at TIMESTAMPTZ DEFAULT NOW(),
            is_guest BOOLEAN DEFAULT FALSE,
            UNIQUE(room_id, user_id)
        );
        
        -- Create an index for faster queries
        CREATE INDEX idx_room_participants_room_id ON room_participants(room_id);
        CREATE INDEX idx_room_participants_user_id ON room_participants(user_id);
        
        -- Enable RLS
        ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for room_participants
        CREATE POLICY "Allow all operations on room_participants"
            ON room_participants FOR ALL
            TO public
            USING (true)
            WITH CHECK (true);
    END IF;

    -- Ensure the last_active_at column exists in rooms
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'last_active_at'
    ) THEN
        ALTER TABLE rooms ADD COLUMN last_active_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Ensure guest profile handling in profiles table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_guest'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_guest BOOLEAN DEFAULT FALSE;
    END IF;

    -- Ensure appropriate check for profiles to allow guest IDs that don't reference auth.users
    -- First, remove the foreign key constraint if it exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'profiles' 
        AND ccu.column_name = 'id'
    ) THEN
        -- Drop the foreign key constraint
        ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
    END IF;

    -- Add a new constraint that allows guest profiles
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_id_auth_or_guest 
    CHECK (
        (auth.uid() = id) OR 
        EXISTS (
            SELECT 1 FROM profiles WHERE id = profiles.id AND is_guest = TRUE
        )
    );
END $$;

-- Update room_participants RLS policies to allow guest access
DROP POLICY IF EXISTS "Allow all operations on room_participants" ON room_participants;
CREATE POLICY "Allow all operations on room_participants"
    ON room_participants FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Update the rooms table policy to allow both regular and guest users
DROP POLICY IF EXISTS "Allow all operations on rooms" ON rooms;
CREATE POLICY "Allow all operations on rooms"
    ON rooms FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
