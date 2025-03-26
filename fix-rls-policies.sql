-- Drop existing RLS policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON rooms;
DROP POLICY IF EXISTS "Enable insert access for all users" ON rooms;
DROP POLICY IF EXISTS "Enable update access for room creators" ON rooms;
DROP POLICY IF EXISTS "Enable delete access for room creators" ON rooms;

-- Enable RLS on rooms table
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Create policies for rooms table
CREATE POLICY "Enable read access for all users" 
ON rooms FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for all users" 
ON rooms FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update access for room creators" 
ON rooms FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Enable delete access for room creators" 
ON rooms FOR DELETE 
USING (auth.uid() = created_by);

-- Enable RLS on room_participants table
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for room_participants table
CREATE POLICY "Enable read access for all users"
ON room_participants FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for all users"
ON room_participants FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update for own participant record"
ON room_participants FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for own participant record"
ON room_participants FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages table
CREATE POLICY "Enable read access for all users"
ON messages FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for all users"
ON messages FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update for message creators"
ON messages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for message creators"
ON messages FOR DELETE
USING (auth.uid() = user_id);
