-- Add search visibility and summary fields to talent_profiles
-- This allows talents to opt-in to business search and write a brief summary
-- that businesses can see before requesting a connection

DO $$
BEGIN
  -- Add search_visible column if it doesn't exist (opt-in/opt-out toggle)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'talent_profiles'
      AND column_name = 'search_visible'
  ) THEN
    ALTER TABLE public.talent_profiles ADD COLUMN search_visible BOOLEAN DEFAULT false;
    -- Add comment explaining the field
    COMMENT ON COLUMN public.talent_profiles.search_visible IS 'If true, talent profile is visible in Business Map search. Talent controls this setting.';
  END IF;

  -- Add search_summary column if it doesn't exist (brief description for business search)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'talent_profiles'
      AND column_name = 'search_summary'
  ) THEN
    ALTER TABLE public.talent_profiles ADD COLUMN search_summary TEXT;
    -- Add comment explaining the field
    COMMENT ON COLUMN public.talent_profiles.search_summary IS 'Brief summary written by talent for business search visibility. Only visible when search_visible is true. Examples: "Actor with 10 years experience, looking for roles in the next 3 months"';
  END IF;

  -- Add availability_description column if it doesn't exist (when looking for roles)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'talent_profiles'
      AND column_name = 'availability_description'
  ) THEN
    ALTER TABLE public.talent_profiles ADD COLUMN availability_description TEXT;
    -- Add comment explaining the field
    COMMENT ON COLUMN public.talent_profiles.availability_description IS 'Description of when talent is looking for roles (e.g., "Looking for acting roles in the next 3 months")';
  END IF;
END $$;

-- Create index for faster filtering by search visibility
CREATE INDEX IF NOT EXISTS idx_talent_profiles_search_visible 
  ON public.talent_profiles(search_visible) 
  WHERE search_visible = true;
