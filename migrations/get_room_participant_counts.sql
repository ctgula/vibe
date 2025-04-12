-- Create a stored procedure to count room participants efficiently
CREATE OR REPLACE FUNCTION get_room_participant_counts(room_ids uuid[])
RETURNS TABLE (room_id uuid, count bigint) 
LANGUAGE sql
AS $$
  SELECT room_id, COUNT(*) as count
  FROM room_participants
  WHERE room_id = ANY(room_ids)
  GROUP BY room_id;
$$;
