-- ============================================
-- Business Bank & Template System Migrations
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Business Bank Items Table
-- ============================================

CREATE TABLE IF NOT EXISTS business_bank_items (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,          -- e.g. image, video, text, link, logo
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_path TEXT,
  file_type TEXT,
  file_size BIGINT,
  metadata JSONB,                   -- Flexible structured metadata per item type
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist (in case table was created without some columns)
DO $$
BEGIN
  -- file_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'business_bank_items'
    AND column_name = 'file_url'
  ) THEN
    ALTER TABLE business_bank_items ADD COLUMN file_url TEXT;
  END IF;
  
  -- file_path
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'business_bank_items'
    AND column_name = 'file_path'
  ) THEN
    ALTER TABLE business_bank_items ADD COLUMN file_path TEXT;
  END IF;
  
  -- file_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'business_bank_items'
    AND column_name = 'file_type'
  ) THEN
    ALTER TABLE business_bank_items ADD COLUMN file_type TEXT;
  END IF;
  
  -- file_size
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'business_bank_items'
    AND column_name = 'file_size'
  ) THEN
    ALTER TABLE business_bank_items ADD COLUMN file_size BIGINT;
  END IF;
  
  -- metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'business_bank_items'
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE business_bank_items ADD COLUMN metadata JSONB;
  END IF;
  
  -- is_active
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'business_bank_items'
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE business_bank_items ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Ensure is_active column exists (in case table was created without it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'business_bank_items'
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE business_bank_items ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_bank_items_user_id ON business_bank_items(user_id);
CREATE INDEX IF NOT EXISTS idx_business_bank_items_item_type ON business_bank_items(item_type);

-- Create is_active index only if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'business_bank_items'
    AND column_name = 'is_active'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_business_bank_items_is_active ON business_bank_items(is_active);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE business_bank_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Business owners can view their own bank items
DROP POLICY IF EXISTS "Business owners can view own bank items" ON business_bank_items;
CREATE POLICY "Business owners can view own bank items"
ON business_bank_items FOR SELECT
USING (auth.uid() = user_id);

-- Business owners can insert their own bank items
DROP POLICY IF EXISTS "Business owners can insert own bank items" ON business_bank_items;
CREATE POLICY "Business owners can insert own bank items"
ON business_bank_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Business owners can update their own bank items
DROP POLICY IF EXISTS "Business owners can update own bank items" ON business_bank_items;
CREATE POLICY "Business owners can update own bank items"
ON business_bank_items FOR UPDATE
USING (auth.uid() = user_id);

-- Business owners can delete their own bank items
DROP POLICY IF EXISTS "Business owners can delete own bank items" ON business_bank_items;
CREATE POLICY "Business owners can delete own bank items"
ON business_bank_items FOR DELETE
USING (auth.uid() = user_id);

-- Public read access for active items (for public profile display)
-- Simplified: only checks if business profile exists
DROP POLICY IF EXISTS "Public can view active business bank items" ON business_bank_items;
DO $$
BEGIN
  -- Only create this policy if is_active column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'business_bank_items'
    AND column_name = 'is_active'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view active business bank items"
    ON business_bank_items FOR SELECT
    USING (
      is_active = true
      AND EXISTS (
        SELECT 1 FROM business_profiles
        WHERE business_profiles.user_id = business_bank_items.user_id
      )
    )';
  ELSE
    -- Fallback: allow all items if is_active doesn't exist
    EXECUTE 'CREATE POLICY "Public can view active business bank items"
    ON business_bank_items FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM business_profiles
        WHERE business_profiles.user_id = business_bank_items.user_id
      )
    )';
  END IF;
END $$;

-- ============================================
-- 2. Business Profile Template Configuration
-- ============================================

-- Add template configuration columns to business_profiles
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS selected_template_id TEXT,
ADD COLUMN IF NOT EXISTS template_config JSONB DEFAULT '{}'::jsonb;

-- Index for template queries
CREATE INDEX IF NOT EXISTS idx_business_profiles_template_id ON business_profiles(selected_template_id) WHERE selected_template_id IS NOT NULL;

-- ============================================
-- Notes:
-- 1. Create the 'business-bank' storage bucket in Supabase Dashboard:
--    - Go to Storage
--    - Create new bucket named 'business-bank'
--    - Make it public (or configure RLS policies as needed)
-- ============================================
