-- Add is_private column to rooms table
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
