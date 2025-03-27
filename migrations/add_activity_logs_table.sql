-- Create activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable row level security
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Set up RLS policies
-- Anyone can view activity logs for rooms they have access to
CREATE POLICY "Anyone can view room activity logs" 
  ON public.activity_logs FOR SELECT USING (true);

-- Any authenticated user can create activity logs
CREATE POLICY "Any authenticated user can create activity logs" 
  ON public.activity_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add index for better query performance
CREATE INDEX activity_logs_room_id_idx ON public.activity_logs(room_id);
CREATE INDEX activity_logs_created_at_idx ON public.activity_logs(created_at);
