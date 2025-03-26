-- Check if room_participants table exists, if not create it
CREATE TABLE IF NOT EXISTS room_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_speaker BOOLEAN DEFAULT false,
  has_raised_hand BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (room_id, user_id)
);

-- Enable row level security
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Room participants are viewable by everyone" 
  ON room_participants FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join rooms" 
  ON room_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their status" 
  ON room_participants FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" 
  ON room_participants FOR DELETE USING (auth.uid() = user_id);

-- Add to realtime publication for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
