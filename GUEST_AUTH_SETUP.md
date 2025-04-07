# Guest Authentication System Setup

This guide provides instructions for setting up and fixing the guest authentication system in the VIBE audio app. These changes will address the following issues:

1. Room creation in guest mode not working correctly
2. Profile navigation not functioning when clicked
3. Real-time subscriptions related to room_participants table

## Database Schema Updates

Run the following SQL in your Supabase SQL Editor to update the database schema:

```sql
-- Fix the rooms table to support both authenticated users and guest users
ALTER TABLE IF EXISTS "public"."rooms" 
  ADD COLUMN IF NOT EXISTS "created_by_guest" UUID,
  ADD COLUMN IF NOT EXISTS "is_public" BOOLEAN DEFAULT TRUE,
  ALTER COLUMN "created_by" DROP NOT NULL,
  DROP COLUMN IF EXISTS "title",
  DROP COLUMN IF EXISTS "theme",
  DROP COLUMN IF EXISTS "last_active_at",
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT '{}'::TEXT[];

-- Rename topics to tags if it exists and tags doesn't exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rooms' 
    AND column_name = 'topics'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rooms' 
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE "public"."rooms" RENAME COLUMN "topics" TO "tags";
  END IF;
END $$;

-- Fix the room_participants table to support both authenticated users and guest users
ALTER TABLE IF EXISTS "public"."room_participants" 
  ADD COLUMN IF NOT EXISTS "guest_id" UUID,
  ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT TRUE,
  ALTER COLUMN "user_id" DROP NOT NULL;

-- Fix the profiles table to support both authenticated users and guest users
ALTER TABLE IF EXISTS "public"."profiles" 
  ADD COLUMN IF NOT EXISTS "display_name" TEXT,
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE;

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

-- Create room_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."room_messages" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "room_id" UUID NOT NULL,
  "user_id" UUID,
  "guest_id" UUID,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "room_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE,
  CONSTRAINT "room_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  CONSTRAINT "room_messages_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
  CONSTRAINT "room_messages_user_or_guest_check" CHECK ((user_id IS NOT NULL) OR (guest_id IS NOT NULL))
);

-- Create activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "room_id" UUID,
  "user_id" UUID,
  "guest_id" UUID,
  "action" TEXT NOT NULL,
  "details" JSONB,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "activity_logs_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE,
  CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  CONSTRAINT "activity_logs_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_room_participants_room_id" ON "public"."room_participants" ("room_id");
CREATE INDEX IF NOT EXISTS "idx_room_participants_user_id" ON "public"."room_participants" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_room_participants_guest_id" ON "public"."room_participants" ("guest_id");
CREATE INDEX IF NOT EXISTS "idx_room_messages_room_id" ON "public"."room_messages" ("room_id");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_room_id" ON "public"."activity_logs" ("room_id");

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
```

## Session Token Implementation

The RLS policies rely on a session token to identify guest users. In your app, when a guest user is created, we generate a unique session token, store it in the `guest_sessions` table, and set it in the Supabase client using a custom setting:

```javascript
// Set the session token in Supabase
await supabase.rpc('set_config', { key: 'session_token', value: sessionToken });
```

This is implemented in the `useAuth` hook with the following key functions:

1. `setSupabaseSessionToken` - Sets the session token in Supabase
2. `retrieveGuestSession` - Retrieves a guest session from localStorage and sets the token
3. `ensureSessionToken` - Ensures the session token is set before any database operations
4. `clearGuestSession` - Clears the guest session when signing out or converting to a registered user

## Code Changes

The following files have been updated to support the enhanced guest authentication system:

1. `hooks/useAuth.ts` - Enhanced to support both authenticated users and guest sessions with session tokens
2. `app/room/create/page.tsx` - Updated to handle room creation for both authenticated users and guests
3. `app/room/[id]/page.tsx` - Updated to handle room joining for both authenticated users and guests
4. `lib/database.types.ts` - Updated to reflect the new database schema

## Testing the Changes

After applying the database schema changes and updating the code, you should test the following flows:

1. **Guest User Flow**:
   - Visit the welcome page and continue as guest
   - Create a room as a guest
   - Join a room as a guest
   - Convert from guest to authenticated user

2. **Authenticated User Flow**:
   - Sign up or sign in
   - Create a room
   - Join a room
   - Update profile information

## Troubleshooting

If you encounter issues with real-time subscriptions:

1. Make sure the `is_active` column exists in the `room_participants` table
2. Check that the Supabase client is properly configured for real-time subscriptions
3. Verify that the subscription channels are correctly set up with the proper filters

For room creation issues:

1. Ensure both `created_by` and `created_by_guest` columns exist in the `rooms` table
2. Verify that the `created_by` column allows NULL values
3. Check that the room creation logic properly sets either `created_by` or `created_by_guest` based on the user type
4. Verify that the session token is being set correctly using the browser console (look for "✅ Guest session token set in Supabase" message)

## Next Steps

After implementing these changes, consider the following improvements:

1. Add functionality to merge guest data with user data when a guest converts to an authenticated user
2. Implement better error handling for guest session management
3. Add analytics tracking for guest vs. authenticated user behavior
4. Implement session token refresh mechanism for long-lived guest sessions
