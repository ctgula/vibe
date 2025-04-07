-- Fix guest auth issues

-- 1. Add is_private column to rooms if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'is_private'
    ) THEN
        ALTER TABLE rooms ADD COLUMN is_private BOOLEAN DEFAULT FALSE;
        
        -- Update existing rooms
        UPDATE rooms SET is_private = FALSE WHERE is_private IS NULL;
    END IF;
END $$;

-- 2. Add is_active column to room_participants if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'room_participants' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE room_participants
        ADD COLUMN is_active boolean NOT NULL DEFAULT true;
        
        -- Update existing participants
        UPDATE room_participants SET is_active = TRUE WHERE is_active IS NULL;
    END IF;
END $$;
