-- ============================================
-- FORCE FIX: Business Bank Images Not Rendering
-- Makes bucket public for read access + bulletproof RLS policies
-- ============================================

-- STEP 1: Make the bucket public (allows direct URL access)
UPDATE storage.buckets
SET public = true
WHERE id = 'business-bank';

-- STEP 2: Ensure RLS is enabled on storage.objects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- STEP 3: Drop ALL existing policies for business-bank bucket
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND (
      policyname LIKE '%business%bank%' 
      OR policyname LIKE '%business_bank%'
      OR policyname LIKE '%business%owner%'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- STEP 4: INSERT policy - Owners can upload to their own directory
CREATE POLICY "business_bank_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-bank'
  AND split_part(name, '/', 1) = 'business'
  AND split_part(name, '/', 2) = auth.uid()::text
);

-- STEP 5: SELECT policy - PUBLIC READ ACCESS (anyone can read files from active business profiles)
-- This is the key fix - allows public/anonymous users to read files
CREATE POLICY "business_bank_select_public_all"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'business-bank'
  AND split_part(name, '/', 1) = 'business'
  AND (
    -- Allow if it's from an active business profile
    EXISTS (
      SELECT 1 FROM business_profiles bp
      WHERE bp.user_id::text = split_part(name, '/', 2)
      AND (
        bp.is_active = true
        OR NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'business_profiles'
          AND column_name = 'is_active'
        )
      )
    )
    -- OR allow if user is the owner (for authenticated users)
    OR (
      auth.uid() IS NOT NULL
      AND split_part(name, '/', 2) = auth.uid()::text
    )
  )
);

-- STEP 6: UPDATE policy - Owners can update their own files
CREATE POLICY "business_bank_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-bank'
  AND split_part(name, '/', 1) = 'business'
  AND split_part(name, '/', 2) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'business-bank'
  AND split_part(name, '/', 1) = 'business'
  AND split_part(name, '/', 2) = auth.uid()::text
);

-- STEP 7: DELETE policy - Owners can delete their own files
CREATE POLICY "business_bank_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-bank'
  AND split_part(name, '/', 1) = 'business'
  AND split_part(name, '/', 2) = auth.uid()::text
);

-- STEP 8: Verify the bucket is now public
SELECT 
  id, 
  name, 
  public,
  CASE WHEN public THEN '✓ Bucket is PUBLIC - files can be accessed via public URLs' 
       ELSE '✗ Bucket is PRIVATE - files require signed URLs' 
  END as status
FROM storage.buckets
WHERE id = 'business-bank';
