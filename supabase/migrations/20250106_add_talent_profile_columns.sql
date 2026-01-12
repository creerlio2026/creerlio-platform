-- Add missing columns to existing talent_profiles table
-- This will store the portfolio data and template selection

-- Add avatar and banner URLs if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='talent_profiles' AND column_name='avatar_url') THEN
        ALTER TABLE public.talent_profiles ADD COLUMN avatar_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='talent_profiles' AND column_name='banner_url') THEN
        ALTER TABLE public.talent_profiles ADD COLUMN banner_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='talent_profiles' AND column_name='selected_template_id') THEN
        ALTER TABLE public.talent_profiles ADD COLUMN selected_template_id INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='talent_profiles' AND column_name='visible_sections') THEN
        ALTER TABLE public.talent_profiles ADD COLUMN visible_sections TEXT[] DEFAULT ARRAY['intro', 'skills', 'experience', 'education', 'projects', 'social']::TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='talent_profiles' AND column_name='name') THEN
        ALTER TABLE public.talent_profiles ADD COLUMN name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='talent_profiles' AND column_name='title') THEN
        ALTER TABLE public.talent_profiles ADD COLUMN title TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='talent_profiles' AND column_name='bio') THEN
        ALTER TABLE public.talent_profiles ADD COLUMN bio TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='talent_profiles' AND column_name='skills') THEN
        ALTER TABLE public.talent_profiles ADD COLUMN skills TEXT[];
    END IF;
END $$;

-- Create an index on selected_template_id for faster queries
CREATE INDEX IF NOT EXISTS idx_talent_profiles_template ON public.talent_profiles(selected_template_id);

-- Comment explaining the structure
COMMENT ON COLUMN public.talent_profiles.selected_template_id IS 'ID of the template selected by the talent (1-18)';
COMMENT ON COLUMN public.talent_profiles.avatar_url IS 'URL to the talent avatar/profile picture stored in Supabase Storage';
COMMENT ON COLUMN public.talent_profiles.banner_url IS 'URL to the talent banner image stored in Supabase Storage';
COMMENT ON COLUMN public.talent_profiles.visible_sections IS 'Array of section names to show in the portfolio (intro, skills, experience, etc.)';
