-- ============================================
-- Ensure business_profiles has required columns and proper RLS
-- Safe migration: only adds columns if they don't exist
-- ============================================

-- Check if business_profiles table exists, create if not
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add columns only if they don't exist
DO $$
BEGIN
  -- business_name column (required - this is what the table actually uses)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_profiles' 
    AND column_name = 'business_name'
  ) THEN
    ALTER TABLE public.business_profiles ADD COLUMN business_name text NOT NULL;
  END IF;
  
  -- Also add 'name' as an alias if it doesn't exist (for compatibility)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_profiles' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.business_profiles ADD COLUMN name text;
  END IF;

  -- Description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_profiles' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.business_profiles ADD COLUMN description text;
  END IF;

  -- Industry
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_profiles' 
    AND column_name = 'industry'
  ) THEN
    ALTER TABLE public.business_profiles ADD COLUMN industry text;
  END IF;

  -- Website
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_profiles' 
    AND column_name = 'website'
  ) THEN
    ALTER TABLE public.business_profiles ADD COLUMN website text;
  END IF;

  -- City
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_profiles' 
    AND column_name = 'city'
  ) THEN
    ALTER TABLE public.business_profiles ADD COLUMN city text;
  END IF;

  -- State
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_profiles' 
    AND column_name = 'state'
  ) THEN
    ALTER TABLE public.business_profiles ADD COLUMN state text;
  END IF;

  -- Country
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_profiles' 
    AND column_name = 'country'
  ) THEN
    ALTER TABLE public.business_profiles ADD COLUMN country text;
  END IF;

  -- user_id (for linking to auth.users)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_profiles' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.business_profiles ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;

  -- is_active (for RLS)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_profiles' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.business_profiles ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Create index on business_name if it doesn't exist (primary column)
CREATE INDEX IF NOT EXISTS business_profiles_business_name_idx ON public.business_profiles(business_name);

-- Create index on name if it exists (for compatibility)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_profiles' 
    AND column_name = 'name'
  ) THEN
    CREATE INDEX IF NOT EXISTS business_profiles_name_idx ON public.business_profiles(name);
  END IF;
END $$;

-- Create index on user_id if it doesn't exist
CREATE INDEX IF NOT EXISTS business_profiles_user_id_idx ON public.business_profiles(user_id);

-- Enable RLS if not already enabled
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (to recreate with correct logic)
DROP POLICY IF EXISTS "Business owners can manage own profile" ON public.business_profiles;
DROP POLICY IF EXISTS business_profiles_own_manage ON public.business_profiles;
DROP POLICY IF EXISTS business_profiles_public_read ON public.business_profiles;
DROP POLICY IF EXISTS business_profiles_insert_own ON public.business_profiles;
DROP POLICY IF EXISTS business_profiles_update_own ON public.business_profiles;
DROP POLICY IF EXISTS business_profiles_delete_own ON public.business_profiles;

-- Basic RLS policies (only create if they don't exist)
DO $$
BEGIN
  -- Public read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'business_profiles' 
    AND policyname = 'business_profiles_public_read'
  ) THEN
    CREATE POLICY business_profiles_public_read
      ON public.business_profiles
      FOR SELECT
      TO anon, authenticated
      USING (is_active = true);
  END IF;

  -- Users can INSERT their own business profile (user_id must match auth.uid())
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'business_profiles' 
    AND policyname = 'business_profiles_insert_own'
  ) THEN
    CREATE POLICY business_profiles_insert_own
      ON public.business_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Users can UPDATE their own business profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'business_profiles' 
    AND policyname = 'business_profiles_update_own'
  ) THEN
    CREATE POLICY business_profiles_update_own
      ON public.business_profiles
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Users can DELETE their own business profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'business_profiles' 
    AND policyname = 'business_profiles_delete_own'
  ) THEN
    CREATE POLICY business_profiles_delete_own
      ON public.business_profiles
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;
