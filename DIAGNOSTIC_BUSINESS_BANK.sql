-- ============================================
-- Business Bank & Template System Diagnostic
-- Run this to check if all migrations are complete
-- ============================================

-- 1. Check if business_bank_items table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'business_bank_items'
    ) THEN '✓ business_bank_items table exists'
    ELSE '✗ business_bank_items table MISSING'
  END AS table_check;

-- 2. Check business_bank_items columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'business_bank_items'
ORDER BY ordinal_position;

-- 3. Check if is_active column exists
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

-- 4. Check business_bank_items indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'business_bank_items'
ORDER BY indexname;

-- 5. Check RLS is enabled
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = 'business_bank_items'
      AND rowsecurity = true
    ) THEN '✓ RLS is enabled on business_bank_items'
    ELSE '✗ RLS is NOT enabled on business_bank_items'
  END AS rls_check;

-- 6. Check RLS policies on business_bank_items
SELECT 
  policyname,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'business_bank_items'
ORDER BY policyname;

-- 7. Check business_profiles template columns
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'business_profiles'
      AND column_name = 'selected_template_id'
    ) THEN '✓ selected_template_id column exists'
    ELSE '✗ selected_template_id column MISSING'
  END AS template_id_check;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'business_profiles'
      AND column_name = 'template_config'
    ) THEN '✓ template_config column exists'
    ELSE '✗ template_config column MISSING'
  END AS template_config_check;

-- 8. Check business_profiles template index
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = 'business_profiles'
      AND indexname = 'idx_business_profiles_template_id'
    ) THEN '✓ template_id index exists'
    ELSE '✗ template_id index MISSING'
  END AS template_index_check;

-- 9. Summary: Count items in business_bank_items (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'business_bank_items'
  ) THEN
    RAISE NOTICE 'business_bank_items table has % rows', (
      SELECT COUNT(*) FROM business_bank_items
    );
  ELSE
    RAISE NOTICE 'business_bank_items table does not exist';
  END IF;
END $$;

-- 10. Check storage bucket (manual check required)
-- Note: Storage buckets cannot be checked via SQL
-- Please verify in Supabase Dashboard → Storage that 'business-bank' bucket exists
