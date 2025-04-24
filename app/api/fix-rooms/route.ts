import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const migrationSQL = `
    -- Check if is_active column exists in room_participants table, add if not
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'room_participants' 
        AND column_name = 'is_active'
      ) THEN
        ALTER TABLE public.room_participants 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
        
        COMMENT ON COLUMN public.room_participants.is_active IS 
        'Flag to indicate if participant is currently active in the room';
      END IF;
    END $$;

    -- Check if is_active column exists in rooms table, add if not
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rooms' 
        AND column_name = 'is_active'
      ) THEN
        ALTER TABLE public.rooms 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
        
        COMMENT ON COLUMN public.rooms.is_active IS 
        'Flag to indicate if this room is active and available';
      END IF;
    END $$;

    -- Ensure creator_id is correctly set up
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rooms' 
        AND column_name = 'created_by'
      ) THEN
        ALTER TABLE public.rooms 
        ADD COLUMN created_by UUID REFERENCES auth.users(id);
        
        COMMENT ON COLUMN public.rooms.created_by IS 
        'Reference to the user who created this room';
      END IF;
    END $$;

    -- Create function to automatically join room creator as participant
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

    -- Update RLS policies for rooms
    ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

    -- Policy for selecting rooms - anyone can see active rooms
    DROP POLICY IF EXISTS "Anyone can view active rooms" ON public.rooms;
    CREATE POLICY "Anyone can view active rooms" 
      ON public.rooms FOR SELECT 
      USING (is_active = true);

    -- Policy for inserting rooms - authenticated users can create rooms
    DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;
    CREATE POLICY "Authenticated users can create rooms" 
      ON public.rooms FOR INSERT 
      TO authenticated
      WITH CHECK (created_by = auth.uid());

    -- Policy for updating rooms - only creator can update
    DROP POLICY IF EXISTS "Creators can update rooms" ON public.rooms;
    CREATE POLICY "Creators can update rooms" 
      ON public.rooms FOR UPDATE 
      TO authenticated
      USING (created_by = auth.uid());

    -- Update RLS policies for room_participants
    ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

    -- Policy for seeing room participants
    DROP POLICY IF EXISTS "Anyone can view room participants" ON public.room_participants;
    CREATE POLICY "Anyone can view room participants" 
      ON public.room_participants FOR SELECT 
      USING (true);

    -- Policy for joining rooms - authenticated users can join rooms
    DROP POLICY IF EXISTS "Authenticated users can join rooms" ON public.room_participants;
    CREATE POLICY "Authenticated users can join rooms" 
      ON public.room_participants FOR INSERT 
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    -- Policy for updating room participants - only self records
    DROP POLICY IF EXISTS "Users can update their room participation" ON public.room_participants;
    CREATE POLICY "Users can update their room participation" 
      ON public.room_participants FOR UPDATE 
      TO authenticated
      USING (user_id = auth.uid());

    -- Add function to support guest users joining rooms
    CREATE OR REPLACE FUNCTION join_room_as_guest(
      p_room_id UUID,
      p_guest_id UUID
    ) RETURNS BOOLEAN AS $$
    DECLARE
      v_result BOOLEAN;
    BEGIN
      -- Check if guest exists
      IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_guest_id AND is_guest = true
      ) THEN
        RETURN false;
      END IF;
      
      -- Add guest to room
      INSERT INTO public.room_participants (room_id, user_id, is_active)
      VALUES (p_room_id, p_guest_id, true)
      ON CONFLICT (room_id, user_id) 
      DO UPDATE SET is_active = true;
      
      RETURN true;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Grant execute permission to anon and authenticated 
    GRANT EXECUTE ON FUNCTION public.join_room_as_guest TO anon, authenticated;
    `;

    // Execute the migration SQL
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('Error applying room fixes:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        sql: migrationSQL,
        note: 'Migration failed. You may need to manually run the SQL in the Supabase SQL editor.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Room system fixes applied successfully',
      changes: [
        'Added is_active column to room_participants table',
        'Added is_active column to rooms table',
        'Ensured created_by column exists in rooms table',
        'Created trigger to auto-join room creator as participant',
        'Updated RLS policies for rooms and room_participants',
        'Added function to support guest users joining rooms'
      ]
    });
  } catch (error: any) {
    console.error('Error in fix-rooms API route:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
