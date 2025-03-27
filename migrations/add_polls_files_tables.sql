-- Create polls table
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create poll votes table
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(poll_id, user_id) -- Each user can only vote once per poll
);

-- Create files table
CREATE TABLE IF NOT EXISTS public.files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add theme column to rooms table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'rooms' AND column_name = 'theme'
  ) THEN
    ALTER TABLE public.rooms ADD COLUMN theme JSONB DEFAULT '{}'::jsonb;
  END IF;
END
$$;

-- Enable row level security
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Set up RLS policies for polls
CREATE POLICY "Anyone can view polls" 
  ON public.polls FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create polls" 
  ON public.polls FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Set up RLS policies for poll votes
CREATE POLICY "Anyone can view poll votes" 
  ON public.poll_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" 
  ON public.poll_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Set up RLS policies for files
CREATE POLICY "Anyone can view files" 
  ON public.files FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload files" 
  ON public.files FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create storage bucket for room files if it doesn't exist
-- Note: This must be executed by an admin or via the Supabase dashboard
-- INSERT INTO storage.buckets (id, name)
-- VALUES ('room-files', 'room-files')
-- ON CONFLICT (id) DO NOTHING;
