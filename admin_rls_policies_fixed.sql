-- Admin RLS Policies for Supabase (Fixed Version)
-- Run this in Supabase SQL Editor to allow admin users to access all records
-- Make sure you've set is_admin: true in your user metadata first!

-- ============================================
-- DROP EXISTING POLICIES IF THEY EXIST
-- ============================================

DROP POLICY IF EXISTS "Admins can read all talent profiles" ON talent_profiles;
DROP POLICY IF EXISTS "Admins can update all talent profiles" ON talent_profiles;
DROP POLICY IF EXISTS "Admins can read all business profiles" ON business_profiles;
DROP POLICY IF EXISTS "Admins can update all business profiles" ON business_profiles;
DROP POLICY IF EXISTS "Admins can read all talent bank items" ON talent_bank_items;
DROP POLICY IF EXISTS "Admins can read all business profile pages" ON business_profile_pages;

-- ============================================
-- ADMIN POLICIES FOR TALENT_PROFILES
-- ============================================

-- Allow admins to read all talent profiles
-- Checks user metadata for is_admin flag
CREATE POLICY "Admins can read all talent profiles"
ON talent_profiles FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  OR (auth.jwt() -> 'user_metadata' ->> 'admin')::boolean = true
);

-- Allow admins to update all talent profiles
CREATE POLICY "Admins can update all talent profiles"
ON talent_profiles FOR UPDATE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  OR (auth.jwt() -> 'user_metadata' ->> 'admin')::boolean = true
);

-- ============================================
-- ADMIN POLICIES FOR BUSINESS_PROFILES
-- ============================================

-- Allow admins to read all business profiles
CREATE POLICY "Admins can read all business profiles"
ON business_profiles FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  OR (auth.jwt() -> 'user_metadata' ->> 'admin')::boolean = true
);

-- Allow admins to update all business profiles
CREATE POLICY "Admins can update all business profiles"
ON business_profiles FOR UPDATE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  OR (auth.jwt() -> 'user_metadata' ->> 'admin')::boolean = true
);

-- ============================================
-- ADMIN POLICIES FOR TALENT_BANK_ITEMS
-- ============================================

-- Allow admins to read all talent bank items
CREATE POLICY "Admins can read all talent bank items"
ON talent_bank_items FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  OR (auth.jwt() -> 'user_metadata' ->> 'admin')::boolean = true
);

-- ============================================
-- ADMIN POLICIES FOR BUSINESS_PROFILE_PAGES
-- ============================================

-- Allow admins to read all business profile pages
CREATE POLICY "Admins can read all business profile pages"
ON business_profile_pages FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  OR (auth.jwt() -> 'user_metadata' ->> 'admin')::boolean = true
);

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this after creating policies to verify your admin status:
-- SELECT 
--   id,
--   email,
--   raw_user_meta_data->>'is_admin' as is_admin,
--   raw_user_meta_data->>'admin' as admin_flag
-- FROM auth.users 
-- WHERE email = 'simon060965@gmail.com';

