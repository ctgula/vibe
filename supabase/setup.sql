-- Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON rooms;
DROP POLICY IF EXISTS "Enable insert access for all users" ON rooms;
DROP POLICY IF EXISTS "Enable update access for room creators" ON rooms;
DROP POLICY IF EXISTS "Enable delete access for room creators" ON rooms;

DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable update access for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable delete access for own profile" ON profiles;

DROP POLICY IF EXISTS "Enable read access for all users" ON room_participants;
DROP POLICY IF EXISTS "Enable insert access for all users" ON room_participants;
DROP POLICY IF EXISTS "Enable update for own participant record" ON room_participants;
DROP POLICY IF EXISTS "Enable delete for own participant record" ON room_participants;

DROP POLICY IF EXISTS "Enable read access for all users" ON messages;
DROP POLICY IF EXISTS "Enable insert access for all users" ON messages;
DROP POLICY IF EXISTS "Enable update for message creators" ON messages;
DROP POLICY IF EXISTS "Enable delete for message creators" ON messages;

-- Create policies for profiles table
CREATE POLICY "Enable read access for all users"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON profiles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "Enable delete access for own profile"
ON profiles FOR DELETE
USING (auth.uid() = id OR auth.uid() IS NULL);

-- Create policies for rooms table
CREATE POLICY "Enable read access for all users" 
ON rooms FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for all users" 
ON rooms FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update access for room creators" 
ON rooms FOR UPDATE 
USING (auth.uid() = created_by OR auth.uid() IS NULL);

CREATE POLICY "Enable delete access for room creators" 
ON rooms FOR DELETE 
USING (auth.uid() = created_by OR auth.uid() IS NULL);

-- Create policies for room_participants table
CREATE POLICY "Enable read access for all users"
ON room_participants FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for all users"
ON room_participants FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update for own participant record"
ON room_participants FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Enable delete for own participant record"
ON room_participants FOR DELETE
USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Create policies for messages table
CREATE POLICY "Enable read access for all users"
ON messages FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for all users"
ON messages FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update for message creators"
ON messages FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Enable delete for message creators"
ON messages FOR DELETE
USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Create or update tables if needed
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES profiles(id),
    is_live BOOLEAN DEFAULT true,
    enable_video BOOLEAN DEFAULT false,
    topics TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_speaker BOOLEAN DEFAULT false,
    is_muted BOOLEAN DEFAULT true,
    has_raised_hand BOOLEAN DEFAULT false,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
