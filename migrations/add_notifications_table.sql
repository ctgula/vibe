-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  content JSONB NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable row level security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Set up RLS policies
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

-- Any authenticated user can create notifications
CREATE POLICY "Any authenticated user can create notifications" 
  ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications" 
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
  ON public.notifications FOR DELETE USING (auth.uid() = user_id);
