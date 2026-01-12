-- ============================================
-- Ensure jobs table exists with all required columns
-- This migration is idempotent and safe to run multiple times
-- ============================================

-- Create jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.jobs (
  id BIGSERIAL PRIMARY KEY,
  business_profile_id BIGINT NOT NULL,
  
  -- Job details
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  responsibilities TEXT,
  
  -- Employment details
  employment_type TEXT,
  salary_min DOUBLE PRECISION,
  salary_max DOUBLE PRECISION,
  salary_currency TEXT DEFAULT 'USD',
  remote_allowed BOOLEAN DEFAULT false,
  
  -- Location
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location TEXT,
  
  -- Skills and requirements
  required_skills JSONB,
  preferred_skills JSONB,
  experience_level TEXT,
  education_level TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  
  -- Application details
  application_url TEXT,
  application_email TEXT,
  application_deadline TIMESTAMPTZ,
  
  -- Metadata
  tags JSONB,
  extra_metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Add missing columns if they don't exist (for existing tables)
-- This MUST happen before creating indexes or policies that reference these columns
DO $$
BEGIN
  -- Add application_email column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'application_email'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN application_email TEXT;
  END IF;
  
  -- Add is_active column (CRITICAL - used in indexes and RLS policies)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  
  -- Add status column (CRITICAL - used in indexes and RLS policies)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN status TEXT DEFAULT 'draft';
  END IF;
  
  -- Add job detail columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'requirements'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN requirements TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'responsibilities'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN responsibilities TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN description TEXT;
  END IF;
  
  -- Add employment detail columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'employment_type'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN employment_type TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'remote_allowed'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN remote_allowed BOOLEAN DEFAULT false;
  END IF;
  
  -- Add location columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'city'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN city TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'state'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN state TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'country'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN country TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'location'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN location TEXT;
  END IF;
  
  -- Add skill columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'required_skills'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN required_skills JSONB;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'preferred_skills'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN preferred_skills JSONB;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'experience_level'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN experience_level TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'education_level'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN education_level TEXT;
  END IF;
  
  -- Add application columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'application_url'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN application_url TEXT;
  END IF;
END $$;

-- Add foreign key constraint if business_profiles table exists (optional)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'business_profiles'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND constraint_name = 'fk_jobs_business_profile'
  ) THEN
    ALTER TABLE public.jobs 
    ADD CONSTRAINT fk_jobs_business_profile 
    FOREIGN KEY (business_profile_id) 
    REFERENCES public.business_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_business_profile_id ON public.jobs(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_jobs_title ON public.jobs(title);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON public.jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow idempotent re-runs)
DROP POLICY IF EXISTS "Business owners can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Business owners can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Business owners can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Business owners can delete own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Public can view published jobs" ON public.jobs;

-- RLS Policies: Business owners can manage their own jobs
CREATE POLICY "Business owners can view own jobs"
ON public.jobs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_profiles
    WHERE business_profiles.id = jobs.business_profile_id
    AND business_profiles.user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Business owners can insert own jobs"
ON public.jobs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_profiles
    WHERE business_profiles.id = jobs.business_profile_id
    AND business_profiles.user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Business owners can update own jobs"
ON public.jobs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.business_profiles
    WHERE business_profiles.id = jobs.business_profile_id
    AND business_profiles.user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Business owners can delete own jobs"
ON public.jobs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.business_profiles
    WHERE business_profiles.id = jobs.business_profile_id
    AND business_profiles.user_id::text = auth.uid()::text
  )
);

-- Public can view published jobs
CREATE POLICY "Public can view published jobs"
ON public.jobs FOR SELECT
USING (
  status = 'published' 
  AND is_active = true
  AND EXISTS (
    SELECT 1 FROM public.business_profiles
    WHERE business_profiles.id = jobs.business_profile_id
  )
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_jobs_updated_at ON public.jobs;
CREATE TRIGGER trigger_update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_jobs_updated_at();
