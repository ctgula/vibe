-- Initialize base schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create base tables
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_guest BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT,
    description TEXT DEFAULT '',
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    last_active_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    topics TEXT[] DEFAULT '{}'::TEXT[],
    theme TEXT DEFAULT 'default',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS room_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_speaker BOOLEAN DEFAULT FALSE,
    is_host BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT TRUE,
    has_raised_hand BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_guest BOOLEAN DEFAULT FALSE,
    UNIQUE(room_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rooms_id ON rooms(id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

-- Set up RLS policies that work with both regular and guest users

-- Rooms policies
CREATE POLICY "Allow public read access to rooms"
    ON rooms FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated and guest users to create rooms"
    ON rooms FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow room creators to update their rooms"
    ON rooms FOR UPDATE
    TO public
    USING (auth.uid() = created_by OR EXISTS (
        SELECT 1 FROM profiles WHERE id = created_by AND is_guest = true
    ));

CREATE POLICY "Allow room creators to delete their rooms"
    ON rooms FOR DELETE
    TO public
    USING (auth.uid() = created_by OR EXISTS (
        SELECT 1 FROM profiles WHERE id = created_by AND is_guest = true
    ));

-- Room participants policies
CREATE POLICY "Allow public read access to room participants"
    ON room_participants FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated and guest users to join rooms"
    ON room_participants FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow users to update their own participant status"
    ON room_participants FOR UPDATE
    TO public
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM profiles WHERE id = user_id AND is_guest = true
    ));

CREATE POLICY "Allow users to leave rooms"
    ON room_participants FOR DELETE
    TO public
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM profiles WHERE id = user_id AND is_guest = true
    ));

-- Profiles policies
CREATE POLICY "Allow public read access to profiles"
    ON profiles FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated users to update their own profile"
    ON profiles FOR UPDATE
    TO public
    USING (auth.uid() = id OR is_guest = true);
