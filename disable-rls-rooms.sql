-- Disable RLS for rooms table to allow direct access
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;

-- In case we need to re-enable it later with a more permissive policy:
-- CREATE POLICY "Enable full access to all users" ON rooms
--   USING (true)
--   WITH CHECK (true);
