-- ============================================
-- Diagnostic: Check Storage RLS and Database RLS
-- Run this to identify the exact issue
-- ============================================

-- 1. Check if storage.objects RLS is enabled
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND rowsecurity = true
    ) THEN '✓ RLS enabled on storage.objects'
    ELSE '✗ RLS NOT enabled on storage.objects'
  END AS storage_rls_status;

-- 2. List all storage policies for business-bank
SELECT 
  policyname,
  cmd AS operation,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND (
  policyname LIKE '%business%bank%' 
  OR policyname LIKE '%business_bank%'
)
ORDER BY policyname;

-- 3. Check business_bank_items table RLS
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND table_name = 'business_bank_items' 
      AND rowsecurity = true
    ) THEN '✓ RLS enabled on business_bank_items'
    ELSE '✗ RLS NOT enabled on business_bank_items'
  END AS table_rls_status;

-- 4. List all RLS policies on business_bank_items
SELECT 
  policyname,
  cmd AS operation,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'business_bank_items'
ORDER BY policyname;

-- 5. Check if user_id column exists and is correct type
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'business_bank_items'
AND column_name = 'user_id';

-- 6. Test INSERT permission (will show error if RLS blocks)
-- Replace 'YOUR_USER_ID_HERE' with actual auth.uid() when testing
-- This is just to show the structure
SELECT 
  'To test INSERT, run as authenticated user:' AS instruction,
  'INSERT INTO business_bank_items (user_id, item_type, title) VALUES (auth.uid(), ''test'', ''test'')' AS test_query;
