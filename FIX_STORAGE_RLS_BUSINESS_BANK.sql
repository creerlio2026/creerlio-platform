-- ============================================
-- Supabase Storage RLS Fix for business-bank Bucket
-- Production-ready, idempotent, safe to run multiple times
-- Path structure: business/{user_id}/{filename}
-- ============================================

-- STEP 1: Verify bucket exists (manual check required)
-- Dashboard → Storage → Verify "business-bank" bucket exists
-- Bucket must be PRIVATE (public = false)

-- STEP 2: Enable RLS on storage.objects
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

-- STEP 3: Drop all existing policies for business-bank bucket
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND (policyname LIKE '%business%bank%' OR policyname LIKE '%business_bank%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- STEP 4: INSERT policy (Upload)
-- Path: business/{user_id}/{filename}
-- Condition: user_id must match auth.uid()
DROP POLICY IF EXISTS "business_bank_insert_own" ON storage.objects;
CREATE POLICY "business_bank_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-bank'
  AND (storage.foldername(name))[1] = 'business'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- STEP 5: SELECT policy (Read) - Authenticated users
-- Users can read their own files and files from active business profiles
DROP POLICY IF EXISTS "business_bank_select_authenticated" ON storage.objects;
CREATE POLICY "business_bank_select_authenticated"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-bank'
  AND (storage.foldername(name))[1] = 'business'
  AND (
    -- Own files
    (storage.foldername(name))[2] = auth.uid()::text
    OR
    -- Files from active business profiles (for viewing public profiles)
    EXISTS (
      SELECT 1 FROM business_profiles bp
      WHERE bp.user_id::text = (storage.foldername(name))[2]
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
  )
);

-- STEP 6: SELECT policy (Read) - Public/Anonymous
-- Allow public read for active business profiles (for public profile pages)
DROP POLICY IF EXISTS "business_bank_select_public" ON storage.objects;
CREATE POLICY "business_bank_select_public"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'business-bank'
  AND (storage.foldername(name))[1] = 'business'
  AND EXISTS (
    SELECT 1 FROM business_profiles bp
    WHERE bp.user_id::text = (storage.foldername(name))[2]
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
);

-- STEP 7: UPDATE policy
-- Users can only update their own files
DROP POLICY IF EXISTS "business_bank_update_own" ON storage.objects;
CREATE POLICY "business_bank_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-bank'
  AND (storage.foldername(name))[1] = 'business'
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'business-bank'
  AND (storage.foldername(name))[1] = 'business'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- STEP 8: DELETE policy
-- Users can only delete their own files
DROP POLICY IF EXISTS "business_bank_delete_own" ON storage.objects;
CREATE POLICY "business_bank_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-bank'
  AND (storage.foldername(name))[1] = 'business'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
