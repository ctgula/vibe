-- Add enable_video column to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS enable_video BOOLEAN DEFAULT FALSE;
