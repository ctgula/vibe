-- Add constraints and indexes to profiles table
DO $$ 
BEGIN
    -- Make sure username column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'username') THEN
        ALTER TABLE profiles ADD COLUMN username text;
    END IF;

    -- Add unique constraint to username if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'profiles' AND column_name = 'username'
    ) THEN
        -- Drop any existing index that might conflict
        DROP INDEX IF EXISTS profiles_username_key;
        -- Add unique constraint
        ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);
    END IF;

    -- Add index on username for faster lookups
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'profiles' AND indexname = 'profiles_username_idx'
    ) THEN
        CREATE INDEX profiles_username_idx ON profiles(username);
    END IF;

    -- Make sure id is the primary key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE profiles ADD PRIMARY KEY (id);
    END IF;

    -- Make sure all required columns exist with correct types
    DO $inner$ 
    BEGIN
        -- Add display_name if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'profiles' AND column_name = 'display_name') THEN
            ALTER TABLE profiles ADD COLUMN display_name text;
        END IF;

        -- Add avatar_url if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
            ALTER TABLE profiles ADD COLUMN avatar_url text;
        END IF;

        -- Add is_guest if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'profiles' AND column_name = 'is_guest') THEN
            ALTER TABLE profiles ADD COLUMN is_guest boolean DEFAULT false;
        END IF;

        -- Add created_at if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
            ALTER TABLE profiles ADD COLUMN created_at timestamp with time zone DEFAULT timezone('utc'::text, now());
        END IF;

        -- Add updated_at if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
            ALTER TABLE profiles ADD COLUMN updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());
        END IF;

        -- Add bio if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'profiles' AND column_name = 'bio') THEN
            ALTER TABLE profiles ADD COLUMN bio text;
        END IF;
    END $inner$;
END $$;
