-- Add bio column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE profiles ADD COLUMN bio text;
    END IF;
END $$;
