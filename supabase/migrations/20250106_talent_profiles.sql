-- Create talent_profiles table for storing talent portfolio data
CREATE TABLE IF NOT EXISTS public.talent_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    title TEXT,
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    skills TEXT[],
    visible_sections TEXT[] DEFAULT ARRAY['intro', 'skills', 'experience', 'education', 'projects', 'social']::TEXT[],
    selected_template_id INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.talent_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Talents can view and edit their own profile
CREATE POLICY "Talents can view their own profile"
    ON public.talent_profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Talents can insert their own profile"
    ON public.talent_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Talents can update their own profile"
    ON public.talent_profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Businesses can view talent profiles (for portfolio viewing)
CREATE POLICY "Businesses can view all talent profiles"
    ON public.talent_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'user_type' = 'business'
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.talent_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_talent_profiles_id ON public.talent_profiles(id);
