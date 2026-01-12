-- ============================================
-- Fix talent_profiles RLS policies
-- Remove dependency on users table to avoid circular dependency
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Talent profiles are publicly readable" ON talent_profiles;
DROP POLICY IF EXISTS "Users can manage own talent profile" ON talent_profiles;
DROP POLICY IF EXISTS "talent_profiles_select_own" ON talent_profiles;
DROP POLICY IF EXISTS "talent_profiles_insert_own" ON talent_profiles;
DROP POLICY IF EXISTS "talent_profiles_update_own" ON talent_profiles;
DROP POLICY IF EXISTS "talent_profiles_delete_own" ON talent_profiles;

-- Enable RLS
ALTER TABLE IF EXISTS talent_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own talent profile directly by matching id to auth.uid()
CREATE POLICY "talent_profiles_select_own"
ON talent_profiles
FOR SELECT
TO authenticated
USING (id::text = auth.uid()::text);

-- Also allow public read for active profiles (for matching/search)
-- Only create this policy if is_active column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'talent_profiles' 
      AND column_name = 'is_active'
  ) THEN
    CREATE POLICY "talent_profiles_select_public"
    ON talent_profiles
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);
  ELSE
    -- If is_active doesn't exist, allow public read of all profiles
    CREATE POLICY "talent_profiles_select_public"
    ON talent_profiles
    FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;
END $$;

-- INSERT: Users can insert their own talent profile
CREATE POLICY "talent_profiles_insert_own"
ON talent_profiles
FOR INSERT
TO authenticated
WITH CHECK (id::text = auth.uid()::text);

-- UPDATE: Users can update their own talent profile
CREATE POLICY "talent_profiles_update_own"
ON talent_profiles
FOR UPDATE
TO authenticated
USING (id::text = auth.uid()::text)
WITH CHECK (id::text = auth.uid()::text);

-- DELETE: Users can delete their own talent profile
CREATE POLICY "talent_profiles_delete_own"
ON talent_profiles
FOR DELETE
TO authenticated
USING (id::text = auth.uid()::text);

-- ============================================
-- Summary
-- ============================================
-- This migration fixes talent_profiles RLS to:
-- 1. Remove circular dependency on users table
-- 2. Allow users to manage their own profile by matching id = auth.uid()
-- 3. Allow public read of active profiles for matching/search
