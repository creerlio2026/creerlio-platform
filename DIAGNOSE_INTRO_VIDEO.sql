-- Comprehensive diagnostic for intro video loading issues
-- Run this to check what's happening with intro videos and RLS policies

-- 1. Check RLS policies on talent_bank_items
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'talent_bank_items'
ORDER BY policyname;

-- 2. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'talent_bank_items';

-- 3. Find all intro videos in the database
-- Check if file_url column exists first
SELECT 
  tbi.id,
  tbi.user_id,
  tbi.item_type,
  tbi.title,
  tbi.file_path,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'talent_bank_items' 
      AND column_name = 'file_url'
    ) THEN (SELECT file_url FROM talent_bank_items tbi2 WHERE tbi2.id = tbi.id)
    ELSE NULL
  END as file_url,
  tp.id as talent_profile_id,
  tp.name as talent_name,
  tbi.created_at
FROM talent_bank_items tbi
LEFT JOIN talent_profiles tp ON tp.user_id::text = tbi.user_id::text
WHERE tbi.item_type IN ('intro_video', 'video', 'business_introduction')
ORDER BY tbi.created_at DESC
LIMIT 20;

-- 4. Check connection requests and their status
SELECT 
  tcr.id as request_id,
  tcr.talent_id,
  tcr.business_id,
  tcr.status,
  tp.user_id as talent_user_id,
  bp.user_id as business_user_id,
  tp.name as talent_name,
  bp.name as business_name,
  tcr.created_at
FROM talent_connection_requests tcr
INNER JOIN talent_profiles tp ON tp.id = tcr.talent_id
INNER JOIN business_profiles bp ON bp.id = tcr.business_id
WHERE tcr.status IN ('pending', 'accepted')
ORDER BY tcr.created_at DESC
LIMIT 10;

-- 5. Test if a business can see a talent's intro video (replace with actual IDs)
-- This simulates what the RLS policy should allow
SELECT 
  tbi.id,
  tbi.user_id,
  tbi.item_type,
  tbi.title,
  tbi.file_path,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'talent_bank_items' 
      AND column_name = 'file_url'
    ) THEN (SELECT file_url FROM talent_bank_items tbi2 WHERE tbi2.id = tbi.id)
    ELSE NULL
  END as file_url,
  'Can business view?' as access_check
FROM talent_bank_items tbi
WHERE tbi.item_type IN ('intro_video', 'video', 'business_introduction')
AND EXISTS (
  SELECT 1
  FROM talent_connection_requests tcr
  INNER JOIN business_profiles bp ON bp.id = tcr.business_id
  INNER JOIN talent_profiles tp ON tp.id = tcr.talent_id
  WHERE tp.user_id::text = tbi.user_id::text
  AND tcr.status IN ('accepted', 'pending')
  AND tcr.business_id IS NOT NULL
  AND tcr.talent_id IS NOT NULL
)
ORDER BY tbi.created_at DESC
LIMIT 10;
