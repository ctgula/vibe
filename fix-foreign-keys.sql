-- First, drop the existing foreign key constraint
ALTER TABLE IF EXISTS rooms
DROP CONSTRAINT IF EXISTS rooms_created_by_fkey;

-- Add new foreign key constraint to reference profiles table
ALTER TABLE rooms
ADD CONSTRAINT rooms_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Also update room_participants to reference profiles
ALTER TABLE IF EXISTS room_participants
DROP CONSTRAINT IF EXISTS room_participants_user_id_fkey;

ALTER TABLE room_participants
ADD CONSTRAINT room_participants_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Make sure the rooms table has the correct structure
ALTER TABLE rooms
ALTER COLUMN id SET DATA TYPE uuid USING id::uuid,
ALTER COLUMN id SET DEFAULT gen_random_uuid(),
ALTER COLUMN created_by SET DATA TYPE uuid USING created_by::uuid;

-- Make sure room_participants has correct structure
ALTER TABLE room_participants
ALTER COLUMN room_id SET DATA TYPE uuid USING room_id::uuid,
ALTER COLUMN user_id SET DATA TYPE uuid USING user_id::uuid;
