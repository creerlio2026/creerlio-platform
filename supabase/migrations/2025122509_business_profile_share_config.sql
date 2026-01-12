-- ============================================
-- Business Profile Share Configuration System
-- Allows businesses to control what sections are visible on their public profile
-- ============================================

-- Create business profile share config table
CREATE TABLE IF NOT EXISTS public.business_profile_share_config (
  id BIGSERIAL PRIMARY KEY,
  business_profile_id UUID NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  
  -- Section sharing flags
  share_intro BOOLEAN DEFAULT true,
  share_social BOOLEAN DEFAULT true,
  share_skills BOOLEAN DEFAULT true,
  share_experience BOOLEAN DEFAULT true,
  share_education BOOLEAN DEFAULT true,
  share_referees BOOLEAN DEFAULT true,
  share_projects BOOLEAN DEFAULT true,
  share_attachments BOOLEAN DEFAULT true,
  
  -- Media sharing flags
  share_avatar BOOLEAN DEFAULT true,
  share_banner BOOLEAN DEFAULT true,
  share_intro_video BOOLEAN DEFAULT true,
  
  -- Selected media paths
  selected_avatar_path TEXT,
  selected_banner_path TEXT,
  selected_intro_video_id BIGINT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS business_profile_share_config_business_idx 
  ON public.business_profile_share_config(business_profile_id);
CREATE INDEX IF NOT EXISTS business_profile_share_config_user_idx 
  ON public.business_profile_share_config(user_id);

-- Enable RLS
ALTER TABLE public.business_profile_share_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'business_profile_share_config' 
    AND policyname = 'business_owners_can_view_own_share_config'
  ) THEN
    DROP POLICY business_owners_can_view_own_share_config ON public.business_profile_share_config;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'business_profile_share_config' 
    AND policyname = 'business_owners_can_insert_own_share_config'
  ) THEN
    DROP POLICY business_owners_can_insert_own_share_config ON public.business_profile_share_config;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'business_profile_share_config' 
    AND policyname = 'business_owners_can_update_own_share_config'
  ) THEN
    DROP POLICY business_owners_can_update_own_share_config ON public.business_profile_share_config;
  END IF;
END $$;

-- Create RLS policies
CREATE POLICY business_owners_can_view_own_share_config
  ON public.business_profile_share_config
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY business_owners_can_insert_own_share_config
  ON public.business_profile_share_config
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY business_owners_can_update_own_share_config
  ON public.business_profile_share_config
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_business_profile_share_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS business_profile_share_config_updated_at ON public.business_profile_share_config;
CREATE TRIGGER business_profile_share_config_updated_at
  BEFORE UPDATE ON public.business_profile_share_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_profile_share_config_updated_at();
