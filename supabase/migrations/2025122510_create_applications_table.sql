-- ============================================
-- Create applications table for job applications
-- Allows talent to apply to jobs posted by businesses
-- ============================================

-- Create applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.applications (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL,
  talent_profile_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Application status
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'rejected', 'hired')),
  
  -- Application details
  cover_letter TEXT,
  notes TEXT,
  
  -- Metadata
  extra_metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint: one application per job per talent
  UNIQUE(job_id, talent_profile_id)
);

-- Add missing columns if table already exists without them
DO $$
BEGIN
  -- Add talent_profile_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'applications' 
    AND column_name = 'talent_profile_id'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN talent_profile_id UUID;
  END IF;
  
  -- Add user_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'applications' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Add other columns if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'applications' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN status TEXT DEFAULT 'applied';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'applications' 
    AND column_name = 'cover_letter'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN cover_letter TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'applications' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN notes TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'applications' 
    AND column_name = 'extra_metadata'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN extra_metadata JSONB;
  END IF;
END $$;

-- Add foreign key constraints if tables exist
-- Do this AFTER indexes to ensure table is fully created
DO $$
BEGIN
  -- First verify the applications table and columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'applications' 
    AND column_name = 'talent_profile_id'
  ) THEN
    RAISE EXCEPTION 'applications.talent_profile_id column does not exist - table creation may have failed';
  END IF;
  
  -- Link to jobs table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'id') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_applications_job_id'
      ) THEN
        BEGIN
          ALTER TABLE public.applications
            ADD CONSTRAINT fk_applications_job_id 
            FOREIGN KEY (job_id) 
            REFERENCES public.jobs(id) 
            ON DELETE CASCADE;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Could not create foreign key to jobs: %', SQLERRM;
        END;
      END IF;
    END IF;
  END IF;
  
  -- Link to talent_profiles table - check if table and id column exist
  -- Note: talent_profiles.id is UUID in Supabase, matching the applications.talent_profile_id type
  -- Make this constraint optional - if it fails, the table will still work
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'talent_profiles') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'talent_profiles' 
      AND column_name = 'id'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_applications_talent_profile_id'
      ) THEN
        BEGIN
          ALTER TABLE public.applications
            ADD CONSTRAINT fk_applications_talent_profile_id 
            FOREIGN KEY (talent_profile_id) 
            REFERENCES public.talent_profiles(id) 
            ON DELETE CASCADE;
          RAISE NOTICE 'Successfully created foreign key constraint to talent_profiles';
        EXCEPTION WHEN OTHERS THEN
          -- If foreign key constraint fails, log but don't stop migration
          RAISE NOTICE 'Could not create foreign key to talent_profiles (table may not exist or structure differs): %', SQLERRM;
        END;
      END IF;
    ELSE
      RAISE NOTICE 'talent_profiles table exists but id column not found - skipping foreign key constraint';
    END IF;
  ELSE
    RAISE NOTICE 'talent_profiles table does not exist - skipping foreign key constraint';
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS applications_job_id_idx ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS applications_talent_profile_id_idx ON public.applications(talent_profile_id);
CREATE INDEX IF NOT EXISTS applications_user_id_idx ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS applications_status_idx ON public.applications(status);
CREATE INDEX IF NOT EXISTS applications_created_at_idx ON public.applications(created_at);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'applications' 
    AND policyname = 'talent_can_view_own_applications'
  ) THEN
    DROP POLICY talent_can_view_own_applications ON public.applications;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'applications' 
    AND policyname = 'talent_can_create_own_applications'
  ) THEN
    DROP POLICY talent_can_create_own_applications ON public.applications;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'applications' 
    AND policyname = 'businesses_can_view_applications_for_their_jobs'
  ) THEN
    DROP POLICY businesses_can_view_applications_for_their_jobs ON public.applications;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'applications' 
    AND policyname = 'businesses_can_update_applications_for_their_jobs'
  ) THEN
    DROP POLICY businesses_can_update_applications_for_their_jobs ON public.applications;
  END IF;
END $$;

-- Create RLS policies

-- Talent can view their own applications
CREATE POLICY talent_can_view_own_applications
  ON public.applications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Talent can create their own applications
CREATE POLICY talent_can_create_own_applications
  ON public.applications
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.talent_profiles 
      WHERE talent_profiles.id = applications.talent_profile_id 
      AND talent_profiles.user_id = auth.uid()
    )
  );

-- Businesses can view applications for their jobs
CREATE POLICY businesses_can_view_applications_for_their_jobs
  ON public.applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      INNER JOIN public.business_profiles ON business_profiles.id = jobs.business_profile_id
      WHERE jobs.id = applications.job_id
      AND business_profiles.user_id = auth.uid()
    )
  );

-- Businesses can update applications for their jobs (to change status)
CREATE POLICY businesses_can_update_applications_for_their_jobs
  ON public.applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      INNER JOIN public.business_profiles ON business_profiles.id = jobs.business_profile_id
      WHERE jobs.id = applications.job_id
      AND business_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      INNER JOIN public.business_profiles ON business_profiles.id = jobs.business_profile_id
      WHERE jobs.id = applications.job_id
      AND business_profiles.user_id = auth.uid()
    )
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS applications_updated_at ON public.applications;
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_applications_updated_at();
