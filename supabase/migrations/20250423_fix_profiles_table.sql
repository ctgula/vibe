-- Drop and recreate profiles table with correct schema
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    is_guest BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Guest profiles can be created by anyone"
    ON public.profiles FOR INSERT
    WITH CHECK (is_guest = true OR auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function for guest profile creation
CREATE OR REPLACE FUNCTION create_guest_profile()
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    new_id := gen_random_uuid();
    
    INSERT INTO public.profiles (id, is_guest, full_name)
    VALUES (new_id, true, 'Guest ' || substr(new_id::text, 1, 8));
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
