-- Create the basic schema for the application
-- Regular user authentication only (no guest functionality)

-- Create profiles table with proper constraints
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  theme_color TEXT DEFAULT '#6366F1',
  onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Room table definition
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  topics TEXT[] DEFAULT '{}'::TEXT[]
);

-- Room participants junction table
CREATE TABLE IF NOT EXISTS public.room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  is_speaking BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Create a trigger to auto-create profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    'user_' || floor(extract(epoch from now()))::text,
    'New User'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Automatically add room creator as a participant
CREATE OR REPLACE FUNCTION public.handle_room_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.room_participants (room_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_room_created
  AFTER INSERT ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.handle_room_creation();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Anyone can view active rooms
CREATE POLICY "Rooms are viewable by everyone"
ON public.rooms FOR SELECT USING (is_active = true);

-- Only creators can update or delete their rooms
CREATE POLICY "Users can update their own rooms"
ON public.rooms FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own rooms"
ON public.rooms FOR DELETE USING (auth.uid() = created_by);

-- Anyone can join rooms (add themselves as participants)
CREATE POLICY "Users can join any room"
ON public.room_participants FOR INSERT USING (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND is_active = true)
);

-- Users can only update their own participation status
CREATE POLICY "Users can update their own participation"
ON public.room_participants FOR UPDATE USING (auth.uid() = user_id);

-- Users can see all room participants
CREATE POLICY "Room participants are viewable by everyone"
ON public.room_participants FOR SELECT USING (true);
