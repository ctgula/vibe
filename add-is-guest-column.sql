-- Add is_guest column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;
