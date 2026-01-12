-- Verify that businesses can access intro videos for pending connection requests
-- Fixed version that handles missing file_url column

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
-- Query without file_url first to avoid errors
SELECT 
  id,
  user_id,
  item_type,
  title,
  file_path,
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

-- Check if file_url column exists and add it if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'talent_bank_items' 
    AND column_name = 'file_url'
  ) THEN
    ALTER TABLE talent_bank_items ADD COLUMN file_url TEXT;
    RAISE NOTICE 'Added file_url column to talent_bank_items';
  ELSE
    RAISE NOTICE 'file_url column already exists in talent_bank_items';
  END IF;
END $$;

-- Now query with file_url if it exists
SELECT 
  id,
  user_id,
  item_type,
  title,
  file_path,
  file_url,
  created_at
FROM talent_bank_items
WHERE item_type IN ('intro_video', 'video', 'business_introduction')
ORDER BY created_at DESC
LIMIT 10;
