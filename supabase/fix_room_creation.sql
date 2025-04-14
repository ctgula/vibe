-- Fix Room Creation Issues
-- Run this in your Supabase SQL Editor to add the necessary RLS policies

-- 1. Allow room creation for both authenticated users and guests
CREATE POLICY "Allow room creation for all users"
  ON public.rooms FOR INSERT
  USING (
    (auth.uid() IS NOT NULL) OR 
    (created_by_guest IS NOT NULL)
  );

-- 2. Allow room participants creation for both authenticated users and guests
CREATE POLICY "Allow room participant creation for all users"
  ON public.room_participants FOR INSERT
  USING (
    (auth.uid() IS NOT NULL) OR 
    (guest_id IS NOT NULL)
  );

-- 3. Allow users to view their own rooms
CREATE POLICY "Allow users to view their own rooms"
  ON public.rooms FOR SELECT
  USING (
    (auth.uid() = created_by) OR
    (created_by_guest IS NOT NULL)
  );

-- 4. Allow users to view room participants
CREATE POLICY "Allow users to view room participants"
  ON public.room_participants FOR SELECT
  USING (true);

-- 5. Add is_active column to room_participants if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'room_participants'
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.room_participants ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END
$$;
