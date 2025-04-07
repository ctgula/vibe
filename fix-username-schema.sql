-- Fix the profiles table schema by adding the missing username column
DO $$ 
BEGIN
    -- Check if the username column exists in profiles table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'username'
    ) THEN
        -- Add username column to profiles table
        ALTER TABLE profiles ADD COLUMN username TEXT;
        
        -- Create a unique index on username to ensure uniqueness
        CREATE UNIQUE INDEX idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;
        
        -- Update existing profiles with generated usernames
        UPDATE profiles 
        SET username = 
            CASE 
                WHEN name IS NOT NULL THEN 
                    LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '')) || 
                    FLOOR(1000 + RANDOM() * 9000)::TEXT
                ELSE 
                    'user' || FLOOR(1000 + RANDOM() * 9000)::TEXT
            END
        WHERE username IS NULL;
    END IF;
END $$;
