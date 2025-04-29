-- Create a function to handle room creation with participant in a single transaction
CREATE OR REPLACE FUNCTION create_room_with_participant(
  p_room_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_tags TEXT[],
  p_created_by UUID,
  p_created_by_guest UUID,
  p_is_public BOOLEAN,
  p_user_id UUID,
  p_guest_id UUID
) RETURNS TABLE (
  room_id UUID,
  participant_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant_id UUID;
BEGIN
  -- Validate input
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Room name cannot be empty';
  END IF;

  IF p_created_by IS NULL AND p_created_by_guest IS NULL THEN
    RAISE EXCEPTION 'Either user_id or guest_id must be provided';
  END IF;

  IF p_user_id IS NULL AND p_guest_id IS NULL THEN
    RAISE EXCEPTION 'Either user_id or guest_id must be provided for participant';
  END IF;

  -- Insert the room
  INSERT INTO rooms (
    id,
    name,
    description,
    tags,
    created_by,
    created_by_guest,
    is_public,
    created_at,
    is_active,
    is_private
  ) VALUES (
    p_room_id,
    p_name,
    p_description,
    p_tags,
    p_created_by,
    p_created_by_guest,
    p_is_public,
    NOW(),
    true,
    NOT p_is_public
  );

  -- Generate participant ID
  v_participant_id := gen_random_uuid();

  -- Add the creator as a participant
  INSERT INTO room_participants (
    id,
    room_id,
    user_id,
    guest_id,
    is_speaker,
    is_host,
    is_muted,
    has_raised_hand,
    is_active,
    joined_at
  ) VALUES (
    v_participant_id,
    p_room_id,
    p_user_id,
    p_guest_id,
    true,  -- is_speaker
    true,  -- is_host
    false, -- is_muted
    false, -- has_raised_hand
    true,  -- is_active
    NOW()
  );

  -- Log the activity
  INSERT INTO activity_logs (
    id,
    room_id,
    user_id,
    guest_id,
    action,
    details,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_room_id,
    p_user_id,
    p_guest_id,
    'room_created',
    jsonb_build_object(
      'room_name', p_name,
      'is_public', p_is_public,
      'tags', p_tags
    ),
    NOW()
  );

  -- Return the room and participant IDs
  RETURN QUERY SELECT p_room_id, v_participant_id;
END;
$$;
