-- Verify that businesses can access intro videos for pending connection requests
-- Run this to check if the RLS policy is working correctly

-- Check current RLS policies on talent_bank_items
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'talent_bank_items'
ORDER BY policyname;

-- Check if there are any intro videos in talent_bank_items
-- First check if file_url column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'talent_bank_items' 
    AND column_name = 'file_url'
  ) THEN
    -- Column exists, use it
    PERFORM 1;
  ELSE
    -- Column doesn't exist, we'll query without it
    RAISE NOTICE 'file_url column does not exist in talent_bank_items';
  END IF;
END $$;

-- Query with file_url if it exists, otherwise without it
SELECT 
  id,
  user_id,
  item_type,
  title,
  file_path,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'talent_bank_items' 
      AND column_name = 'file_url'
    ) THEN (SELECT file_url FROM talent_bank_items tbi2 WHERE tbi2.id = talent_bank_items.id)
    ELSE NULL
  END as file_url,
  created_at
FROM talent_bank_items
WHERE item_type IN ('intro_video', 'video', 'business_introduction')
ORDER BY created_at DESC
LIMIT 10;

-- Check connection requests to see if there are pending ones
SELECT 
  id,
  talent_id,
  business_id,
  status,
  created_at
FROM talent_connection_requests
WHERE status IN ('pending', 'accepted')
ORDER BY created_at DESC
LIMIT 10;
