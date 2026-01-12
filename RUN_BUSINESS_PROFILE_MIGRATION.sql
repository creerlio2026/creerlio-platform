-- ============================================
-- Business Profile Page Builder Migration
-- REQUIRED: Run this in Supabase SQL Editor
-- ============================================
-- This migration adds the page_blocks and page_template_id columns
-- needed for the new block-based page builder system.

-- Add page_blocks column to store block-based page structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_profiles' 
    AND column_name = 'page_blocks'
  ) THEN
    ALTER TABLE public.business_profiles ADD COLUMN page_blocks jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  -- Add template_id column to store selected template
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_profiles' 
    AND column_name = 'page_template_id'
  ) THEN
    ALTER TABLE public.business_profiles ADD COLUMN page_template_id text DEFAULT 'employer-brand';
  END IF;
END $$;

-- Create index on page_blocks for faster queries (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS business_profiles_page_blocks_idx ON public.business_profiles USING gin (page_blocks);

-- Add comment explaining the structure
COMMENT ON COLUMN public.business_profiles.page_blocks IS 'JSON array of page blocks defining the business profile page structure';
COMMENT ON COLUMN public.business_profiles.page_template_id IS 'Template ID used for styling and default layout';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully! The page builder is now ready to use.';
END $$;
