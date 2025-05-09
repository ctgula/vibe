-- PART 1: Auto-create profiles for authenticated users 
-- (This builds on your existing trigger but makes it more robust)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_base TEXT;
  username_attempt TEXT;
  counter INTEGER := 0;
  username_exists BOOLEAN;
BEGIN
  -- Check if profile already exists to avoid duplicates
  PERFORM 1 FROM public.profiles WHERE id = NEW.id;
  IF FOUND THEN
    -- Profile already exists, nothing to do
    RETURN NEW;
  END IF;

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
    is_guest,
    onboarded
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
    false,
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

-- PART 2: Auto-create profiles when joining rooms (handles both users and guests)

CREATE OR REPLACE FUNCTION public.ensure_room_participant_has_profile()
RETURNS TRIGGER AS $$
DECLARE
  profile_exists BOOLEAN;
  guest_profile_id UUID;
  username_attempt TEXT;
BEGIN
  -- If the participant has a user_id, check if they have a profile
  IF NEW.user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = NEW.user_id
    ) INTO profile_exists;
    
    -- If no profile exists, create one with basic information
    IF NOT profile_exists THEN
      username_attempt := 'user_' || substring(NEW.user_id::text, 1, 8);
      
      INSERT INTO public.profiles (
        id,
        username,
        display_name,
        created_at,
        updated_at,
        is_guest,
        onboarded
      ) VALUES (
        NEW.user_id,
        username_attempt,
        'User ' || substring(NEW.user_id::text, 1, 6),
        NOW(),
        NOW(),
        false,
        false
      );
    END IF;
  
  -- If it's a guest participant, ensure they have a guest profile
  ELSIF NEW.guest_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles WHERE guest_id = NEW.guest_id
    ) INTO profile_exists;
    
    -- If no guest profile exists, create one
    IF NOT profile_exists THEN
      -- Create a random UUID for the profile
      guest_profile_id := gen_random_uuid();
      username_attempt := 'guest_' || substring(NEW.guest_id::text, 1, 8);
      
      INSERT INTO public.profiles (
        id,
        guest_id,
        username,
        display_name,
        created_at,
        updated_at,
        is_guest,
        onboarded
      ) VALUES (
        guest_profile_id,
        NEW.guest_id,
        username_attempt,
        'Guest ' || substring(NEW.guest_id::text, 1, 6),
        NOW(),
        NOW(),
        true,
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop room participant trigger if it exists
DROP TRIGGER IF EXISTS ensure_participant_profile ON public.room_participants;

-- Create the trigger for room participants
CREATE TRIGGER ensure_participant_profile
  BEFORE INSERT ON public.room_participants
  FOR EACH ROW EXECUTE FUNCTION public.ensure_room_participant_has_profile();
