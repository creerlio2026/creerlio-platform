-- ============================================
-- Quick Fix: Talent Bank Items RLS Policies
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop ALL existing policies on talent_bank_items (including new and old names)
DROP POLICY IF EXISTS "Users can view own talent bank items" ON talent_bank_items;
DROP POLICY IF EXISTS "Users can insert own talent bank items" ON talent_bank_items;
DROP POLICY IF EXISTS "Users can update own talent bank items" ON talent_bank_items;
DROP POLICY IF EXISTS "Users can delete own talent bank items" ON talent_bank_items;
DROP POLICY IF EXISTS "users_select_own_talent_bank_items" ON talent_bank_items;
DROP POLICY IF EXISTS "users_insert_own_talent_bank_items" ON talent_bank_items;
DROP POLICY IF EXISTS "users_update_own_talent_bank_items" ON talent_bank_items;
DROP POLICY IF EXISTS "users_delete_own_talent_bank_items" ON talent_bank_items;

-- Step 2: Enable RLS
ALTER TABLE IF EXISTS talent_bank_items ENABLE ROW LEVEL SECURITY;

-- Step 3: Create new policies (UUID-compatible)
CREATE POLICY "users_select_own_talent_bank_items"
ON talent_bank_items FOR SELECT
TO authenticated
USING (user_id::text = auth.uid()::text);

CREATE POLICY "users_insert_own_talent_bank_items"
ON talent_bank_items FOR INSERT
TO authenticated
WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "users_update_own_talent_bank_items"
ON talent_bank_items FOR UPDATE
TO authenticated
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "users_delete_own_talent_bank_items"
ON talent_bank_items FOR DELETE
TO authenticated
USING (user_id::text = auth.uid()::text);

-- Step 4: Check for problematic data
SELECT 
  COUNT(*) as total_items,
  COUNT(CASE WHEN user_id::text LIKE '%@%' THEN 1 END) as email_format_count
FROM talent_bank_items;

-- If email_format_count > 0, you have data issues that need fixing

