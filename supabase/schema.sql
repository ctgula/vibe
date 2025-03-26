-- Create profiles table that extends Supabase auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_active BOOLEAN DEFAULT true,
  topics TEXT[] DEFAULT '{}'
);

-- Create participants table (for users in rooms)
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  role TEXT CHECK (role IN ('host', 'speaker', 'listener')) NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_muted BOOLEAN DEFAULT true,
  hand_raised BOOLEAN DEFAULT false,
  UNIQUE (room_id, profile_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security (RLS)
-- Profiles: Anyone can read profiles, but only the owner can update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Rooms: Anyone can view active rooms, creators can update
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rooms are viewable by everyone if active" 
  ON rooms FOR SELECT USING (is_active = true);

CREATE POLICY "Room creators can update their rooms" 
  ON rooms FOR UPDATE USING (auth.uid() = created_by);

-- Participants: Anyone can view participants, participants can update their own status
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants are viewable by everyone" 
  ON participants FOR SELECT USING (true);

CREATE POLICY "Participants can update their own status" 
  ON participants FOR UPDATE USING (auth.uid() = profile_id);

-- Messages: Anyone can view messages in a room, participants can insert
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room messages are viewable by everyone" 
  ON messages FOR SELECT USING (true);

CREATE POLICY "Room participants can post messages" 
  ON messages FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants 
      WHERE participants.room_id = room_id 
      AND participants.profile_id = auth.uid()
    )
  );

-- Create function to create a profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'username', 
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create realtime replication for specific tables (needed for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE rooms, participants, messages;
