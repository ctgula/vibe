-- Add policies to allow guest access to essential tables

-- Allow anyone to read profiles (needed for guest access)
CREATE POLICY IF NOT EXISTS "Guests can read profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Allow anyone to read rooms (needed for browsing as guest)
CREATE POLICY IF NOT EXISTS "Guests can read rooms"
  ON public.rooms FOR SELECT
  USING (true);

-- Allow guests to create their own profiles
CREATE POLICY IF NOT EXISTS "Guests can create their own profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (is_guest = true);

-- Allow guests to update their own profiles
CREATE POLICY IF NOT EXISTS "Guests can update their own profiles"
  ON public.profiles FOR UPDATE
  USING (is_guest = true AND id = current_setting('session_token', true)::text)
  WITH CHECK (is_guest = true);

-- Allow anyone to read room_participants (needed for room UI)
CREATE POLICY IF NOT EXISTS "Guests can read room participants"
  ON public.room_participants FOR SELECT
  USING (true);

-- Check if is_active column exists in room_participants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'room_participants' 
    AND column_name = 'is_active'
  ) THEN
    -- Add is_active column to room_participants table
    ALTER TABLE public.room_participants ADD COLUMN is_active boolean DEFAULT true;
    
    -- Add index on is_active for better performance
    CREATE INDEX IF NOT EXISTS idx_room_participants_is_active ON public.room_participants(is_active);
  END IF;
END $$;
