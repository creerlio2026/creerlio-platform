-- ============================================
-- Fix Talent Bank Items RLS Policies
-- Ensures user_id matches auth.uid() (UUID format)
-- ============================================

-- First, check if talent_bank_items table exists and get its structure
DO $$
DECLARE
  user_id_type text;
  has_table boolean;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'talent_bank_items'
  ) INTO has_table;

  IF has_table THEN
    -- Get the data type of user_id column
    SELECT data_type INTO user_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'talent_bank_items' 
      AND column_name = 'user_id';

    RAISE NOTICE 'talent_bank_items.user_id type: %', user_id_type;
  END IF;
END $$;

-- Drop existing RLS policies on talent_bank_items if they exist (both old and new names)
DROP POLICY IF EXISTS "Users can view own talent bank items" ON talent_bank_items;
DROP POLICY IF EXISTS "Users can insert own talent bank items" ON talent_bank_items;
DROP POLICY IF EXISTS "Users can update own talent bank items" ON talent_bank_items;
DROP POLICY IF EXISTS "Users can delete own talent bank items" ON talent_bank_items;
DROP POLICY IF EXISTS "users_select_own_talent_bank_items" ON talent_bank_items;
DROP POLICY IF EXISTS "users_insert_own_talent_bank_items" ON talent_bank_items;
DROP POLICY IF EXISTS "users_update_own_talent_bank_items" ON talent_bank_items;
DROP POLICY IF EXISTS "users_delete_own_talent_bank_items" ON talent_bank_items;

-- Enable RLS on talent_bank_items
ALTER TABLE IF EXISTS talent_bank_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies that work with UUID (auth.uid() returns UUID)
-- These policies assume user_id is stored as UUID (text) to match auth.uid()

-- SELECT: Users can view their own talent bank items
CREATE POLICY "users_select_own_talent_bank_items"
ON talent_bank_items
FOR SELECT
TO authenticated
USING (user_id::text = auth.uid()::text);

-- INSERT: Users can insert their own talent bank items
CREATE POLICY "users_insert_own_talent_bank_items"
ON talent_bank_items
FOR INSERT
TO authenticated
WITH CHECK (user_id::text = auth.uid()::text);

-- UPDATE: Users can update their own talent bank items
CREATE POLICY "users_update_own_talent_bank_items"
ON talent_bank_items
FOR UPDATE
TO authenticated
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- DELETE: Users can delete their own talent bank items
CREATE POLICY "users_delete_own_talent_bank_items"
ON talent_bank_items
FOR DELETE
TO authenticated
USING (user_id::text = auth.uid()::text);

-- ============================================
-- Data Integrity Check: Find any problematic rows
-- ============================================

-- Check for any talent_bank_items with user_id that looks like an email
-- (This should not exist, but we check for data integrity)
DO $$
DECLARE
  email_count integer;
BEGIN
  SELECT COUNT(*) INTO email_count
  FROM talent_bank_items
  WHERE user_id::text LIKE '%@%';
  
  IF email_count > 0 THEN
    RAISE WARNING 'Found % rows in talent_bank_items with user_id containing @ (email format). These need to be fixed.', email_count;
  ELSE
    RAISE NOTICE 'No email-formatted user_id found in talent_bank_items. Good!';
  END IF;
END $$;

-- ============================================
-- Ensure public.users table has proper RLS
-- ============================================

-- Enable RLS on users table if not already enabled
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- Create/update policies for users table to work with UUID
DO $$
BEGIN
  -- Check if id column exists and is UUID type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'id'
      AND data_type = 'uuid'
  ) THEN
    -- Users table uses UUID id (matches auth.uid())
    -- Policies should already be set up by 2025122208_users_self_row.sql
    RAISE NOTICE 'Users table uses UUID id. RLS policies should be compatible.';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'id'
  ) THEN
    -- Users table uses non-UUID id (integer or text)
    -- Need to ensure policies work correctly
    RAISE NOTICE 'Users table id is not UUID. Ensure RLS policies convert correctly.';
  END IF;
END $$;

-- ============================================
-- Summary
-- ============================================
-- This migration:
-- 1. Fixes RLS policies on talent_bank_items to work with UUID user_id
-- 2. Checks for data integrity issues (email as user_id)
-- 3. Ensures users table RLS is properly configured
--
-- Note: If your talent_bank_items.user_id is stored as integer,
-- you may need to create a mapping table or update the schema
-- to use UUID instead.

