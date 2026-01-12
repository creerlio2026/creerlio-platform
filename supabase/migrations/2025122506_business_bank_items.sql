-- ============================================
-- Business Bank Items Table
-- Similar to Talent Bank, stores business-owned assets
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_bank_items_user_id ON business_bank_items(user_id);
CREATE INDEX IF NOT EXISTS idx_business_bank_items_item_type ON business_bank_items(item_type);
CREATE INDEX IF NOT EXISTS idx_business_bank_items_is_active ON business_bank_items(is_active);

-- Enable RLS
ALTER TABLE business_bank_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Business owners can view their own bank items
CREATE POLICY "Business owners can view own bank items"
ON business_bank_items FOR SELECT
USING (auth.uid() = user_id);

-- Business owners can insert their own bank items
CREATE POLICY "Business owners can insert own bank items"
ON business_bank_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Business owners can update their own bank items
CREATE POLICY "Business owners can update own bank items"
ON business_bank_items FOR UPDATE
USING (auth.uid() = user_id);

-- Business owners can delete their own bank items
CREATE POLICY "Business owners can delete own bank items"
ON business_bank_items FOR DELETE
USING (auth.uid() = user_id);

-- Public read access for active items (for public profile display)
CREATE POLICY "Public can view active business bank items"
ON business_bank_items FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM business_profiles
    WHERE business_profiles.user_id = business_bank_items.user_id
    AND business_profiles.is_active = true
  )
);

-- Note: Create the 'business-bank' storage bucket in Supabase Dashboard:
-- 1. Go to Storage
-- 2. Create new bucket named 'business-bank'
-- 3. Make it public (or configure RLS policies as needed)
