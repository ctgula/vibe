-- Creating/fixing room_participants table structure

      -- Make sure room_participants table exists
      CREATE TABLE IF NOT EXISTS room_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID NOT NULL,
        user_id UUID,
        guest_id UUID,
        is_speaker BOOLEAN DEFAULT false,
        is_muted BOOLEAN DEFAULT true,
        has_raised_hand BOOLEAN DEFAULT false,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        is_host BOOLEAN DEFAULT false
      );
    


-- Adding is_active column to room_participants

      -- Add is_active column if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'room_participants' AND column_name = 'is_active'
        ) THEN
          ALTER TABLE room_participants
          ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        END IF;
      END
      $$;
    


-- Adding performance indexes to room_participants

      -- Add helpful indexes for performance
      CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants (room_id);
      CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants (user_id);
      CREATE INDEX IF NOT EXISTS idx_room_participants_guest_id ON room_participants (guest_id);
      CREATE INDEX IF NOT EXISTS idx_room_participants_is_active ON room_participants (is_active);
    


-- Setting up security policies for room_participants

      -- Enable RLS on room_participants
      ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
      
      -- Create SELECT policy for everyone
      DROP POLICY IF EXISTS "Anyone can view room participants" ON room_participants;
      CREATE POLICY "Anyone can view room participants" 
        ON room_participants FOR SELECT USING (true);
      
      -- Create INSERT policy for authenticated and guest users
      DROP POLICY IF EXISTS "Users can join rooms" ON room_participants;
      CREATE POLICY "Users can join rooms" 
        ON room_participants FOR INSERT WITH CHECK (
          (auth.uid() = user_id) OR 
          (auth.uid() IS NULL) -- Allow guest users
        );
      
      -- Create UPDATE policy that only lets you update your own status
      DROP POLICY IF EXISTS "Users can update their own status" ON room_participants;
      CREATE POLICY "Users can update their own status" 
        ON room_participants FOR UPDATE USING (
          (auth.uid() = user_id) OR 
          (auth.uid() IS NULL AND guest_id IS NOT NULL) -- Allow guest users
        );
      
      -- Create DELETE policy that only lets you leave rooms you joined
      DROP POLICY IF EXISTS "Users can leave rooms they joined" ON room_participants;
      CREATE POLICY "Users can leave rooms they joined" 
        ON room_participants FOR DELETE USING (
          (auth.uid() = user_id) OR 
          (auth.uid() IS NULL AND guest_id IS NOT NULL) -- Allow guest users
        );
    


-- Ensuring correct profiles table structure

      -- Ensure profiles table exists with all needed columns
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY,
        username TEXT,
        display_name TEXT,
        avatar_url TEXT,
        bio TEXT,
        theme_color TEXT DEFAULT '#6366f1',
        is_guest BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Add any missing columns to profiles
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'profiles' AND column_name = 'is_guest'
        ) THEN
          ALTER TABLE profiles ADD COLUMN is_guest BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'profiles' AND column_name = 'theme_color'
        ) THEN
          ALTER TABLE profiles ADD COLUMN theme_color TEXT DEFAULT '#6366f1';
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'profiles' AND column_name = 'updated_at'
        ) THEN
          ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
      END
      $$;
    


-- Ensuring correct rooms table structure

      -- Ensure rooms table has the right structure
      CREATE TABLE IF NOT EXISTS rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        created_by UUID,
        created_by_guest UUID,
        is_active BOOLEAN DEFAULT true,
        is_private BOOLEAN DEFAULT false,
        enable_video BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        tags TEXT[] DEFAULT '{}'::TEXT[],
        theme JSONB
      );
      
      -- Add missing columns to rooms table
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'rooms' AND column_name = 'created_by_guest'
        ) THEN
          ALTER TABLE rooms ADD COLUMN created_by_guest UUID;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'rooms' AND column_name = 'is_private'
        ) THEN
          ALTER TABLE rooms ADD COLUMN is_private BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'rooms' AND column_name = 'is_active'
        ) THEN
          ALTER TABLE rooms ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'rooms' AND column_name = 'tags'
        ) THEN
          ALTER TABLE rooms ADD COLUMN tags TEXT[] DEFAULT '{}'::TEXT[];
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'rooms' AND column_name = 'theme'
        ) THEN
          ALTER TABLE rooms ADD COLUMN theme JSONB;
        END IF;
      END
      $$;
    


-- Setting up security policies for rooms

      -- Enable RLS on rooms
      ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
      
      -- Create SELECT policy for rooms
      DROP POLICY IF EXISTS "Allow all test" ON rooms;
      CREATE POLICY "Allow all test" ON rooms FOR SELECT USING (true);
      
      -- Allow any authenticated or guest user to create rooms
      DROP POLICY IF EXISTS "Anyone can create rooms" ON rooms;
      CREATE POLICY "Anyone can create rooms" 
        ON rooms FOR INSERT WITH CHECK (true);
      
      -- Allow room creators to update their rooms
      DROP POLICY IF EXISTS "Creators can update rooms" ON rooms;
      CREATE POLICY "Creators can update rooms" 
        ON rooms FOR UPDATE USING (
          (auth.uid() = created_by) OR 
          (auth.uid() IS NULL AND created_by_guest IS NOT NULL)
        );
    


-- Configuring realtime for room_participants

      -- Add realtime subscription for room_participants
      ALTER PUBLICATION IF EXISTS supabase_realtime 
      ADD TABLE room_participants;
    
