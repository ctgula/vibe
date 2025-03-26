-- Create tables with Row Level Security (RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends the auth.users table)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Followers mapping table
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(follower_id, following_id)
);

-- Rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  is_active BOOLEAN DEFAULT TRUE,
  topics TEXT[] DEFAULT '{}'::TEXT[]
);

-- Participants table
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('host', 'speaker', 'listener')) DEFAULT 'listener',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  is_muted BOOLEAN DEFAULT TRUE,
  hand_raised BOOLEAN DEFAULT FALSE,
  UNIQUE(room_id, profile_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Posts table (for audio recordings outside of rooms)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT,
  duration INTEGER,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Function to automatically create a profile entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || FLOOR(RANDOM() * 1000000)::TEXT),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable row level security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Set up row level security policies

-- Profiles: anyone can view, only the owner can update
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Followers: anyone can view, authenticated users can create, only the follower can delete
CREATE POLICY "Anyone can view followers" 
  ON public.followers FOR SELECT USING (true);

CREATE POLICY "Authenticated users can follow others" 
  ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" 
  ON public.followers FOR DELETE USING (auth.uid() = follower_id);

-- Rooms: anyone can view, authenticated users can create, only host can update/delete
CREATE POLICY "Rooms are viewable by everyone" 
  ON public.rooms FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create rooms" 
  ON public.rooms FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update their rooms" 
  ON public.rooms FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Room creators can delete their rooms" 
  ON public.rooms FOR DELETE USING (auth.uid() = created_by);

-- Participants: anyone can view, authenticated users can join rooms, users can only update/delete themselves
CREATE POLICY "Anyone can view participants" 
  ON public.participants FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join rooms" 
  ON public.participants FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their participant status" 
  ON public.participants FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can leave rooms" 
  ON public.participants FOR DELETE USING (auth.uid() = profile_id);

-- Messages: anyone can view room messages, authenticated users can send messages, users can only delete their own
CREATE POLICY "Anyone can view messages" 
  ON public.messages FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send messages" 
  ON public.messages FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own messages" 
  ON public.messages FOR DELETE USING (auth.uid() = profile_id);

-- Posts: anyone can view, authenticated users can create, only creator can update/delete
CREATE POLICY "Posts are viewable by everyone" 
  ON public.posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" 
  ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Post creators can update their posts" 
  ON public.posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Post creators can delete their posts" 
  ON public.posts FOR DELETE USING (auth.uid() = user_id);
