-- ============================================
-- CHECK BUSINESS_PROFILES SCHEMA
-- Run this in Supabase SQL Editor to see what columns actually exist
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

-- Try to manually refresh PostgREST schema cache (if possible)
-- Note: This may require admin access
NOTIFY pgrst, 'reload schema';
