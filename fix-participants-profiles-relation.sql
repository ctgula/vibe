-- Add explicit foreign key constraint between participants and profiles

-- Check if the foreign key already exists
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_name = 'participants'
        AND constraint_name = 'fk_participants_profiles'
    ) INTO constraint_exists;

    IF NOT constraint_exists THEN
        -- Create the foreign key constraint if it doesn't exist
        ALTER TABLE participants 
        ADD CONSTRAINT fk_participants_profiles
        FOREIGN KEY (profile_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Also check and add the foreign key for messages table
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_name = 'messages'
        AND constraint_name = 'fk_messages_profiles'
    ) INTO constraint_exists;

    IF NOT constraint_exists THEN
        -- Create the foreign key constraint if it doesn't exist
        ALTER TABLE messages 
        ADD CONSTRAINT fk_messages_profiles
        FOREIGN KEY (profile_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE;
    END IF;
END $$;
