-- Auto-create profiles trigger for new Supabase auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_base TEXT;
  username_attempt TEXT;
  counter INTEGER := 0;
BEGIN
  -- Skip if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Create a unique username from email
  username_base := SPLIT_PART(NEW.email, '@', 1);
  username_attempt := username_base;
  
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = username_attempt) LOOP
    counter := counter + 1;
    username_attempt := username_base || counter::TEXT;
  END LOOP;

  -- Create the profile
  INSERT INTO public.profiles (
    id, 
    username, 
    display_name, 
    avatar_url,
    created_at, 
    updated_at, 
    is_guest
  ) VALUES (
    NEW.id,
    username_attempt,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    'https://api.dicebear.com/6.x/avataaars/svg?seed=' || NEW.id,
    NOW(),
    NOW(),
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create profiles for room participants
CREATE OR REPLACE FUNCTION public.ensure_participant_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- For authenticated users
  IF NEW.user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.user_id) THEN
    INSERT INTO public.profiles (
      id, 
      username, 
      display_name, 
      created_at, 
      updated_at, 
      is_guest
    ) VALUES (
      NEW.user_id,
      'user_' || substring(NEW.user_id::text, 1, 8),
      'User ' || substring(NEW.user_id::text, 1, 6),
      NOW(),
      NOW(),
      false
    );
  END IF;
  
  -- For guest users
  IF NEW.guest_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE guest_id = NEW.guest_id) THEN
    INSERT INTO public.profiles (
      id,
      guest_id,
      username, 
      display_name, 
      created_at, 
      updated_at, 
      is_guest
    ) VALUES (
      gen_random_uuid(),
      NEW.guest_id,
      'guest_' || substring(NEW.guest_id::text, 1, 8),
      'Guest ' || substring(NEW.guest_id::text, 1, 6),
      NOW(),
      NOW(),
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger for room participants
DROP TRIGGER IF EXISTS ensure_participant_profile ON public.room_participants;
CREATE TRIGGER ensure_participant_profile
  BEFORE INSERT ON public.room_participants
  FOR EACH ROW EXECUTE FUNCTION public.ensure_participant_profile();

-- Verify the triggers exist
SELECT 
  tgname AS trigger_name,
  relname AS table_name,
  proname AS function_name
FROM pg_trigger
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgname IN ('on_auth_user_created', 'ensure_participant_profile');
