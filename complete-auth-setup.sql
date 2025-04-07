-- Complete auth setup with all required triggers and functions

-- First ensure profiles table has the right structure
DO $$ 
BEGIN
    -- Make sure all required columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'username') THEN
        ALTER TABLE profiles ADD COLUMN username text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'display_name') THEN
        ALTER TABLE profiles ADD COLUMN display_name text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE profiles ADD COLUMN bio text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'is_guest') THEN
        ALTER TABLE profiles ADD COLUMN is_guest boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());
    END IF;

    -- Add username uniqueness constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'profiles' AND column_name = 'username'
    ) THEN
        -- Drop any existing index that might conflict
        DROP INDEX IF EXISTS profiles_username_key;
        
        -- Add unique constraint
        ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username) NOT VALID;
        -- Validate without locking
        ALTER TABLE profiles VALIDATE CONSTRAINT profiles_username_unique;
    END IF;
END $$;

-- Create function to auto-generate profiles on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_base TEXT;
  username_attempt TEXT;
  counter INTEGER := 0;
  username_exists BOOLEAN;
BEGIN
  -- Generate initial username from email
  username_base := LOWER(SPLIT_PART(NEW.email, '@', 1));
  
  -- Clean up non-alphanumeric characters
  username_base := REGEXP_REPLACE(username_base, '[^a-z0-9_]', '', 'g');
  
  -- Limit to reasonable length
  username_base := SUBSTRING(username_base, 1, 15);
  
  -- If username is invalid or empty, use 'user' as base
  IF LENGTH(username_base) < 3 THEN
    username_base := 'user';
  END IF;
  
  -- Start with base username
  username_attempt := username_base;
  
  -- Keep trying usernames until we find one that's available
  -- Limit tries to avoid infinite loop
  FOR counter IN 1..20 LOOP
    BEGIN
      -- Try inserting profile with current username attempt
      INSERT INTO public.profiles (
        id,
        name,
        display_name,
        username,
        avatar_url,
        created_at,
        updated_at,
        is_guest
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 
                NEW.raw_user_meta_data->>'full_name', 
                SPLIT_PART(NEW.email, '@', 1),
                'User'),
        COALESCE(NEW.raw_user_meta_data->>'name', 
                NEW.raw_user_meta_data->>'full_name', 
                SPLIT_PART(NEW.email, '@', 1),
                'User'),
        username_attempt,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 
                'https://api.dicebear.com/6.x/avataaars/svg?seed=' || NEW.id),
        NOW(),
        NOW(),
        false
      );
      
      -- If we got here, insertion succeeded
      RETURN NEW;
      
    EXCEPTION 
      WHEN unique_violation THEN
        -- Try next username
        counter := counter + 1;
        username_attempt := username_base || counter::TEXT;
    END;
  END LOOP;
  
  -- If we exhausted all attempts, try a random suffix
  username_attempt := username_base || '_' || SUBSTRING(MD5(random()::TEXT), 1, 6);
  
  -- Make final attempt with random suffix
  BEGIN
    INSERT INTO public.profiles (
      id,
      name,
      display_name,
      username,
      avatar_url,
      created_at,
      updated_at,
      is_guest
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', 
              NEW.raw_user_meta_data->>'full_name', 
              SPLIT_PART(NEW.email, '@', 1),
              'User'),
      COALESCE(NEW.raw_user_meta_data->>'name', 
              NEW.raw_user_meta_data->>'full_name', 
              SPLIT_PART(NEW.email, '@', 1),
              'User'),
      username_attempt,
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', 
              'https://api.dicebear.com/6.x/avataaars/svg?seed=' || NEW.id),
      NOW(),
      NOW(),
      false
    );
  EXCEPTION 
    WHEN unique_violation THEN
      -- Log error and continue rather than failing the signup
      RAISE WARNING 'Failed to create profile with unique username for user: %', NEW.id;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatically updating updated_at
DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
