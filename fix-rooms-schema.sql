-- Update rooms table schema
ALTER TABLE IF EXISTS rooms
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN id SET DATA TYPE UUID USING id::uuid,
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_id ON rooms(id);
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Allow all operations for public
CREATE POLICY "Allow all operations on rooms"
ON rooms FOR ALL
TO public
USING (true)
WITH CHECK (true);
