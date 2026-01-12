-- Add location columns (country, state, city) to talent_profiles table
-- This enables talent profiles to save location information

DO $$
BEGIN
  -- Add city column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'talent_profiles'
      AND column_name = 'city'
  ) THEN
    ALTER TABLE public.talent_profiles ADD COLUMN city TEXT;
  END IF;

  -- Add state column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'talent_profiles'
      AND column_name = 'state'
  ) THEN
    ALTER TABLE public.talent_profiles ADD COLUMN state TEXT;
  END IF;

  -- Add country column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'talent_profiles'
      AND column_name = 'country'
  ) THEN
    ALTER TABLE public.talent_profiles ADD COLUMN country TEXT;
  END IF;

  -- Add latitude column if it doesn't exist (for map functionality)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'talent_profiles'
      AND column_name = 'latitude'
  ) THEN
    ALTER TABLE public.talent_profiles ADD COLUMN latitude DOUBLE PRECISION;
  END IF;

  -- Add longitude column if it doesn't exist (for map functionality)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'talent_profiles'
      AND column_name = 'longitude'
  ) THEN
    ALTER TABLE public.talent_profiles ADD COLUMN longitude DOUBLE PRECISION;
  END IF;

  -- Add experience_years column if it doesn't exist (for Business Map filters)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'talent_profiles'
      AND column_name = 'experience_years'
  ) THEN
    ALTER TABLE public.talent_profiles ADD COLUMN experience_years INTEGER;
  END IF;

  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'talent_profiles'
      AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.talent_profiles ADD COLUMN phone TEXT;
  END IF;

  -- Add is_active column if it doesn't exist (for filtering)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'talent_profiles'
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.talent_profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Create indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_talent_profiles_country ON public.talent_profiles(country);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_state ON public.talent_profiles(state);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_city ON public.talent_profiles(city);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_location ON public.talent_profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
