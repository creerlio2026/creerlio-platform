-- ============================================
-- Verify business_profiles schema and refresh cache
-- Run this to check what columns actually exist
-- ============================================

-- Show all columns in business_profiles table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'business_profiles'
ORDER BY ordinal_position;

-- Show all RLS policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'business_profiles';
