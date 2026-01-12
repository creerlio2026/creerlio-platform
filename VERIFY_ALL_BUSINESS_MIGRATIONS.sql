-- ============================================
-- Complete Business Profile System Diagnostic
-- Run this to verify ALL migrations are complete
-- ============================================

-- ============================================
-- PART 1: Business Profiles Table
-- ============================================

SELECT '=== BUSINESS_PROFILES TABLE ===' AS section;

-- Check if table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'business_profiles'
    ) THEN '✓ business_profiles table exists'
    ELSE '✗ business_profiles table MISSING - Run 2025122503_ensure_business_profiles_columns.sql'
  END AS check_result;

-- Check required columns
SELECT 
  column_name,
  CASE 
    WHEN column_name IN ('business_name', 'name', 'user_id', 'is_active') THEN '✓ REQUIRED'
    ELSE '  Optional'
  END AS status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'business_profiles'
ORDER BY 
  CASE column_name
    WHEN 'business_name' THEN 1
    WHEN 'name' THEN 2
    WHEN 'user_id' THEN 3
    WHEN 'is_active' THEN 4
    ELSE 5
  END,
  column_name;

-- Check template columns (new system)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'business_profiles'
      AND column_name = 'selected_template_id'
    ) THEN '✓ selected_template_id exists'
    ELSE '✗ selected_template_id MISSING - Run RUN_BUSINESS_BANK_MIGRATIONS.sql'
  END AS template_id_check;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'business_profiles'
      AND column_name = 'template_config'
    ) THEN '✓ template_config exists'
    ELSE '✗ template_config MISSING - Run RUN_BUSINESS_BANK_MIGRATIONS.sql'
  END AS template_config_check;

-- ============================================
-- PART 2: Business Bank Items Table
-- ============================================

SELECT '=== BUSINESS_BANK_ITEMS TABLE ===' AS section;

-- Check if table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'business_bank_items'
    ) THEN '✓ business_bank_items table exists'
    ELSE '✗ business_bank_items table MISSING - Run RUN_BUSINESS_BANK_MIGRATIONS.sql'
  END AS check_result;

-- Check all columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'business_bank_items'
ORDER BY ordinal_position;

-- Check is_active column specifically
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'business_bank_items'
      AND column_name = 'is_active'
    ) THEN '✓ is_active column exists'
    ELSE '✗ is_active column MISSING'
  END AS is_active_check;

-- Check indexes
SELECT 
  indexname,
  CASE 
    WHEN indexname LIKE '%user_id%' THEN '✓ User ID index'
    WHEN indexname LIKE '%item_type%' THEN '✓ Item type index'
    WHEN indexname LIKE '%is_active%' THEN '✓ Is active index'
    ELSE '  Other index'
  END AS status
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'business_bank_items'
ORDER BY indexname;

-- Check RLS
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = 'business_bank_items'
      AND rowsecurity = true
    ) THEN '✓ RLS is enabled'
    ELSE '✗ RLS is NOT enabled'
  END AS rls_check;

-- Check RLS policies
SELECT 
  policyname,
  CASE 
    WHEN policyname LIKE '%view%' THEN '✓ SELECT policy'
    WHEN policyname LIKE '%insert%' THEN '✓ INSERT policy'
    WHEN policyname LIKE '%update%' THEN '✓ UPDATE policy'
    WHEN policyname LIKE '%delete%' THEN '✓ DELETE policy'
    WHEN policyname LIKE '%Public%' THEN '✓ Public read policy'
    ELSE '  Other policy'
  END AS status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'business_bank_items'
ORDER BY policyname;

-- ============================================
-- PART 3: Summary & Counts
-- ============================================

SELECT '=== SUMMARY ===' AS section;

-- Count business profiles
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'business_profiles'
    ) THEN 
      'business_profiles: ' || (SELECT COUNT(*)::text FROM business_profiles) || ' rows'
    ELSE 'business_profiles: Table does not exist'
  END AS profile_count;

-- Count business bank items
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'business_bank_items'
    ) THEN 
      'business_bank_items: ' || (SELECT COUNT(*)::text FROM business_bank_items) || ' rows'
    ELSE 'business_bank_items: Table does not exist'
  END AS bank_items_count;

-- ============================================
-- PART 4: Missing Items Checklist
-- ============================================

SELECT '=== MISSING ITEMS CHECKLIST ===' AS section;

-- Generate a checklist of what's missing
SELECT 
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'business_profiles'
    ) THEN '✗ Run: supabase/migrations/2025122503_ensure_business_profiles_columns.sql'
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'business_profiles'
      AND column_name = 'business_name'
    ) THEN '✗ Run: supabase/migrations/2025122503_ensure_business_profiles_columns.sql'
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'business_bank_items'
    ) THEN '✗ Run: RUN_BUSINESS_BANK_MIGRATIONS.sql'
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'business_profiles'
      AND column_name = 'selected_template_id'
    ) THEN '✗ Run: RUN_BUSINESS_BANK_MIGRATIONS.sql (Part 2)'
    ELSE '✓ All required migrations appear to be complete'
  END AS action_required;
