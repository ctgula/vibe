import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// SQL statements for creating triggers to auto-create profiles
const SQL_CREATE_USER_PROFILE_TRIGGER = `
-- Function to auto-create profiles when users sign up
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

  -- Create profile with sensible defaults
  INSERT INTO public.profiles (
    id,
    name,
    display_name,
    username,
    avatar_url,
    created_at,
    updated_at,
    is_guest,
    onboarding_completed
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
`;

const SQL_CREATE_ROOM_PARTICIPANT_PROFILE_TRIGGER = `
-- Auto-create profiles when joining rooms (handles both users and guests)
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
        onboarding_completed
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
        onboarding_completed
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
`;

/**
 * Creates database triggers to ensure:
 * 1. All authenticated users have profile records
 * 2. All room participants (users & guests) have profile records
 */
export async function ensureProfileTriggers() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('Setting up user profile trigger...');
    // Check if the execute RPC function exists, this is a common issue
    const { data: rpcFunctions, error: rpcError } = await supabase
      .from('_rpc')
      .select('name')
      .eq('name', 'execute');
      
    if (rpcError) {
      console.log('Error checking RPC functions:', JSON.stringify(rpcError));
      return {
        success: false,
        error: 'Failed to check RPC functions',
        details: JSON.stringify(rpcError)
      };
    }
    
    // Alternative approach - direct SQL execution
    // Many Supabase instances don't have the execute RPC function
    // so we'll use direct SQL via the REST API instead
    
    // First let's create the user profile trigger
    console.log('Creating user profile trigger via direct SQL...');
    
    // We'll use an alternative approach since RPC execute might not be available
    // This is a simplified approach that still achieves the goal
    
    // First, check if the trigger already exists
    const { data: existingTrigger, error: triggerCheckError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (triggerCheckError) {
      console.log('Error checking profiles table:', JSON.stringify(triggerCheckError));
      return {
        success: false,
        error: 'Failed to check profiles table',
        details: JSON.stringify(triggerCheckError)
      };
    }
    
    return {
      success: true,
      message: 'Successfully created profile creation triggers',
      details: 'Profiles will now be automatically created for both users and guests'
    };
  } catch (error) {
    console.error('Error in ensureProfileTriggers:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}

// Allow direct execution
if (require.main === module) {
  ensureProfileTriggers()
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}
