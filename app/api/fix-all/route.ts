import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // A comprehensive fix SQL query that addresses all identified issues
    const fixAllSql = `
    -- 1. Fix Profile Table Issues
    
    -- Ensure email is nullable in profiles (to support guest users)
    ALTER TABLE public.profiles 
    ALTER COLUMN email DROP NOT NULL;
    
    -- Ensure username, display_name are present
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'username'
      ) THEN
        ALTER TABLE public.profiles ADD COLUMN username TEXT;
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'display_name'
      ) THEN
        ALTER TABLE public.profiles ADD COLUMN display_name TEXT;
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'bio'
      ) THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'avatar_url'
      ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'theme_color'
      ) THEN
        ALTER TABLE public.profiles ADD COLUMN theme_color TEXT;
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'preferred_genres'
      ) THEN
        ALTER TABLE public.profiles ADD COLUMN preferred_genres TEXT[];
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'onboarding_completed'
      ) THEN
        ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_guest'
      ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_guest BOOLEAN DEFAULT false;
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_demo'
      ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_demo BOOLEAN DEFAULT false;
      END IF;
    END $$;
    
    -- 2. Fix Room Tables Issues
    
    -- Ensure rooms table is properly set up
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'rooms'
      ) THEN
        CREATE TABLE public.rooms (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          description TEXT,
          created_by UUID REFERENCES auth.users(id),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          topics TEXT[]
        );
      END IF;
    END $$;
    
    -- Ensure is_active column exists in rooms
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rooms' 
        AND column_name = 'is_active'
      ) THEN
        ALTER TABLE public.rooms ADD COLUMN is_active BOOLEAN DEFAULT true;
      END IF;
    END $$;
    
    -- Ensure room_participants table exists with proper structure
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'room_participants'
      ) THEN
        CREATE TABLE public.room_participants (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
          user_id UUID REFERENCES auth.users(id),
          is_active BOOLEAN DEFAULT true,
          is_speaking BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          UNIQUE(room_id, user_id)
        );
      END IF;
    END $$;
    
    -- Ensure is_active column exists in room_participants
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'room_participants' 
        AND column_name = 'is_active'
      ) THEN
        ALTER TABLE public.room_participants ADD COLUMN is_active BOOLEAN DEFAULT true;
      END IF;
    END $$;
    
    -- 3. Fix RLS Policies
    
    -- Enable RLS on all tables
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
    
    -- Profile policies
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    CREATE POLICY "Public profiles are viewable by everyone" 
      ON public.profiles FOR SELECT 
      USING (true);
      
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
    CREATE POLICY "Users can insert their own profile" 
      ON public.profiles FOR INSERT 
      TO authenticated
      WITH CHECK (auth.uid() = id);
      
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    CREATE POLICY "Users can update their own profile" 
      ON public.profiles FOR UPDATE 
      TO authenticated
      USING (auth.uid() = id);
    
    -- Room policies
    DROP POLICY IF EXISTS "Rooms are viewable by everyone" ON public.rooms;
    CREATE POLICY "Rooms are viewable by everyone" 
      ON public.rooms FOR SELECT 
      USING (is_active = true);
      
    DROP POLICY IF EXISTS "Users can create rooms" ON public.rooms;
    CREATE POLICY "Users can create rooms" 
      ON public.rooms FOR INSERT 
      TO authenticated
      WITH CHECK (auth.uid() = created_by);
      
    DROP POLICY IF EXISTS "Room creators can update rooms" ON public.rooms;
    CREATE POLICY "Room creators can update rooms" 
      ON public.rooms FOR UPDATE 
      TO authenticated
      USING (auth.uid() = created_by);
    
    -- Room participants policies
    DROP POLICY IF EXISTS "Room participants are viewable by everyone" ON public.room_participants;
    CREATE POLICY "Room participants are viewable by everyone" 
      ON public.room_participants FOR SELECT 
      USING (true);
      
    DROP POLICY IF EXISTS "Users can join rooms" ON public.room_participants;
    CREATE POLICY "Users can join rooms" 
      ON public.room_participants FOR INSERT 
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
      
    DROP POLICY IF EXISTS "Users can update their participation" ON public.room_participants;
    CREATE POLICY "Users can update their participation" 
      ON public.room_participants FOR UPDATE 
      TO authenticated
      USING (auth.uid() = user_id);
    
    -- 4. Create auto-join trigger
    CREATE OR REPLACE FUNCTION public.handle_new_room()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Insert the creator as a participant
      INSERT INTO public.room_participants (room_id, user_id, is_active)
      VALUES (NEW.id, NEW.created_by, true)
      ON CONFLICT (room_id, user_id) 
      DO UPDATE SET is_active = true;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Create or replace the trigger
    DROP TRIGGER IF EXISTS on_room_created ON public.rooms;
    CREATE TRIGGER on_room_created
      AFTER INSERT ON public.rooms
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_room();
    
    -- 5. Create demo user for easy testing (if doesn't exist)
    DO $$
    DECLARE 
      demo_user_id UUID;
    BEGIN
      -- Check if a demo user exists in auth.users
      SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@example.com' LIMIT 1;
      
      -- If demo user doesn't exist in profiles, create one
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'demo@example.com') THEN
        INSERT INTO public.profiles (
          id, 
          email, 
          username, 
          display_name, 
          created_at, 
          updated_at, 
          is_guest, 
          onboarding_completed,
          is_demo,
          theme_color,
          bio
        ) VALUES (
          COALESCE(demo_user_id, uuid_generate_v4()),
          'demo@example.com',
          'demo_user',
          'Demo User',
          NOW(),
          NOW(),
          false,
          true,
          true,
          '#6366f1',
          'This is a demo user for testing purposes.'
        );
      END IF;
    END $$;
    `;

    // Execute the fix-all SQL
    const { error } = await supabase.rpc('exec_sql', { sql: fixAllSql });

    if (error) {
      console.error('Error applying fix-all script:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        sql: fixAllSql,
        note: 'Fix-all script failed. You may need to run parts of the SQL manually.'
      }, { status: 500 });
    }

    // Create a demo room if none exists
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id')
      .limit(1);

    if (!rooms || rooms.length === 0) {
      const { data: demoUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_demo', true)
        .single();

      if (demoUser) {
        await supabase
          .from('rooms')
          .insert([
            {
              name: 'Welcome Room',
              description: 'A place to get started and meet other users',
              created_by: demoUser.id,
              is_active: true,
              topics: ['general', 'welcome', 'music']
            }
          ]);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'All fixes applied successfully',
      changes: [
        'Fixed profile table schema issues',
        'Fixed room table schema and added is_active column',
        'Fixed room_participants table and added is_active column',
        'Set up proper RLS policies for all tables',
        'Created auto-join trigger for room creators',
        'Created demo user for testing'
      ],
      next_steps: [
        '1. Visit the homepage and use the "Rooms" button to navigate to the rooms page',
        '2. Try signing in with the demo account (demo@example.com) or create a new account',
        '3. Test creating and joining rooms',
        '4. Test navigating to user profiles'
      ]
    });
  } catch (error: any) {
    console.error('Error in fix-all API route:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
