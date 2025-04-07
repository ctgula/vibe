-- Create guest_sessions table to store guest session tokens
CREATE TABLE IF NOT EXISTS "public"."guest_sessions" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "profile_id" UUID NOT NULL,
  "session_token" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  PRIMARY KEY ("id"),
  CONSTRAINT "guest_sessions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

-- Create unique index on session_token
CREATE UNIQUE INDEX IF NOT EXISTS "idx_guest_sessions_token" ON "public"."guest_sessions" ("session_token");

-- Create index on profile_id for faster lookups
CREATE INDEX IF NOT EXISTS "idx_guest_sessions_profile_id" ON "public"."guest_sessions" ("profile_id");

-- Create function to set session token in local settings
CREATE OR REPLACE FUNCTION "public"."set_config"(key text, value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.' || key, value, false);
END;
$$;

-- Create function to get current guest profile ID from session token
CREATE OR REPLACE FUNCTION "public"."get_guest_profile_id"()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_token text;
  profile_id uuid;
BEGIN
  -- Get the session token from the current settings
  session_token := current_setting('app.session_token', true);
  
  -- If no session token is set, return null
  IF session_token IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the profile ID associated with the session token
  SELECT gs.profile_id INTO profile_id
  FROM public.guest_sessions gs
  WHERE gs.session_token = session_token
  AND gs.expires_at > now();
  
  RETURN profile_id;
END;
$$;

-- Update RLS policies to use the guest_profile_id function
-- For the rooms table
CREATE OR REPLACE POLICY "Users can insert their own rooms" 
  ON "public"."rooms" FOR INSERT 
  WITH CHECK (
    (auth.uid() = created_by) OR 
    (created_by_guest = get_guest_profile_id())
  );

CREATE OR REPLACE POLICY "Users can update their own rooms" 
  ON "public"."rooms" FOR UPDATE 
  USING (
    (auth.uid() = created_by) OR 
    (created_by_guest = get_guest_profile_id())
  );

-- For the room_participants table
CREATE OR REPLACE POLICY "Users can insert their own participation" 
  ON "public"."room_participants" FOR INSERT 
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (guest_id = get_guest_profile_id())
  );

CREATE OR REPLACE POLICY "Users can update their own participation" 
  ON "public"."room_participants" FOR UPDATE 
  USING (
    (auth.uid() = user_id) OR 
    (guest_id = get_guest_profile_id())
  );

-- For the room_messages table
CREATE OR REPLACE POLICY "Users can insert their own messages" 
  ON "public"."room_messages" FOR INSERT 
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (guest_id = get_guest_profile_id())
  );

-- For the activity_logs table
CREATE OR REPLACE POLICY "Users can insert their own activity logs" 
  ON "public"."activity_logs" FOR INSERT 
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (guest_id = get_guest_profile_id())
  );
