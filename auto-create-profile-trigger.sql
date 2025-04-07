-- Function to auto-create profiles when users sign up
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
  username_base := REGEXP_REPLACE(username_base, '[^a-z0-9_]', '', 'g');
  username_attempt := username_base;
  
  -- Keep trying usernames until we find one that's available
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.profiles WHERE username = username_attempt
    ) INTO username_exists;
    
    EXIT WHEN NOT username_exists;
    
    counter := counter + 1;
    username_attempt := username_base || counter::TEXT;
  END LOOP;

  -- Create profile with sensible defaults that won't conflict with schema
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
