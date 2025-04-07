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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_room_participants_room_id" ON "public"."room_participants" ("room_id");
CREATE INDEX IF NOT EXISTS "idx_room_participants_user_id" ON "public"."room_participants" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_room_participants_guest_id" ON "public"."room_participants" ("guest_id");
CREATE INDEX IF NOT EXISTS "idx_room_messages_room_id" ON "public"."room_messages" ("room_id");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_room_id" ON "public"."activity_logs" ("room_id");

-- Enable Row Level Security
ALTER TABLE "public"."rooms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."room_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."room_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;

-- Create policies for rooms
CREATE POLICY IF NOT EXISTS "Public rooms are viewable by everyone" 
  ON "public"."rooms" FOR SELECT 
  USING (is_public = true);

CREATE POLICY IF NOT EXISTS "Users can insert their own rooms" 
  ON "public"."rooms" FOR INSERT 
  WITH CHECK (
    (auth.uid() = created_by) OR 
    (created_by_guest IS NOT NULL)
  );

CREATE POLICY IF NOT EXISTS "Users can update their own rooms" 
  ON "public"."rooms" FOR UPDATE 
  USING (
    (auth.uid() = created_by) OR 
    (created_by_guest IN (
      SELECT id FROM profiles WHERE is_guest = true
    ))
  );

-- Create policies for room_participants
CREATE POLICY IF NOT EXISTS "Room participants are viewable by everyone" 
  ON "public"."room_participants" FOR SELECT 
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert their own participation" 
  ON "public"."room_participants" FOR INSERT 
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (guest_id IS NOT NULL)
  );

CREATE POLICY IF NOT EXISTS "Users can update their own participation" 
  ON "public"."room_participants" FOR UPDATE 
  USING (
    (auth.uid() = user_id) OR 
    (guest_id IN (
      SELECT id FROM profiles WHERE is_guest = true
    ))
  );

-- Create policies for room_messages
CREATE POLICY IF NOT EXISTS "Room messages are viewable by everyone" 
  ON "public"."room_messages" FOR SELECT 
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert their own messages" 
  ON "public"."room_messages" FOR INSERT 
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (guest_id IS NOT NULL)
  );

-- Create policies for activity_logs
CREATE POLICY IF NOT EXISTS "Activity logs are viewable by everyone" 
  ON "public"."activity_logs" FOR SELECT 
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert their own activity logs" 
  ON "public"."activity_logs" FOR INSERT 
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (guest_id IS NOT NULL)
  );
