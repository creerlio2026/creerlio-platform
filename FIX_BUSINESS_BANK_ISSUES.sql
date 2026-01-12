-- ============================================
-- Fix Business Bank Issues
-- Drops old policies and view, then fixes schema
-- ============================================

-- Step 1: Drop old RLS policies that depend on business_id
DROP POLICY IF EXISTS "business_owner_select_business_bank" ON business_bank_items;
DROP POLICY IF EXISTS "business_owner_insert_business_bank" ON business_bank_items;
DROP POLICY IF EXISTS "business_owner_update_business_bank" ON business_bank_items;
DROP POLICY IF EXISTS "business_owner_delete_business_bank" ON business_bank_items;

-- Step 2: Drop view that depends on business_id
DROP VIEW IF EXISTS business_bank_items_safe CASCADE;

-- Step 3: Now we can safely drop the business_id column
ALTER TABLE business_bank_items DROP COLUMN IF EXISTS business_id;

-- Step 4: Ensure user_id column exists and is correct
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'business_bank_items'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE business_bank_items ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 5: Make sure user_id is NOT NULL
ALTER TABLE business_bank_items ALTER COLUMN user_id SET NOT NULL;

-- Step 6: Recreate RLS policies with correct user_id-based policies
-- (These should already exist from RUN_BUSINESS_BANK_MIGRATIONS.sql, but ensure they're there)

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
