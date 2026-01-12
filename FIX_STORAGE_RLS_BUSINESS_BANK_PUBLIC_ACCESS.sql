-- ============================================
-- Fix Storage RLS for business-bank Bucket
-- Allow public/anonymous access to files from active business profiles
-- Path structure: business/{user_id}/{filename}
-- ============================================

-- Ensure RLS is enabled on storage.objects
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

-- Drop existing policies for business-bank (if they exist)
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
      OR policyname = 'business_owner_read_business_bank'
      OR policyname = 'business_owner_insert_business_bank'
      OR policyname = 'business_owner_update_business_bank'
      OR policyname = 'business_owner_delete_business_bank'
      OR policyname = 'business_bank_insert_own'
      OR policyname = 'business_bank_select_authenticated'
      OR policyname = 'business_bank_select_public'
      OR policyname = 'business_bank_update_own'
      OR policyname = 'business_bank_delete_own'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- INSERT policy: Owners can upload to their own directory
CREATE POLICY "business_bank_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-bank'
  AND split_part(name, '/', 1) = 'business'
  AND split_part(name, '/', 2) = auth.uid()::text
);

-- SELECT policy: Authenticated users can read own files + files from active business profiles
CREATE POLICY "business_bank_select_authenticated"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-bank'
  AND split_part(name, '/', 1) = 'business'
  AND (
    -- Own files
    split_part(name, '/', 2) = auth.uid()::text
    OR
    -- Files from active business profiles (for viewing public profiles)
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
  )
);

-- SELECT policy: Public/Anonymous users can read files from active business profiles
CREATE POLICY "business_bank_select_public"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'business-bank'
  AND split_part(name, '/', 1) = 'business'
  AND EXISTS (
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
);

-- UPDATE policy: Owners can update their own files
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

-- DELETE policy: Owners can delete their own files
CREATE POLICY "business_bank_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-bank'
  AND split_part(name, '/', 1) = 'business'
  AND split_part(name, '/', 2) = auth.uid()::text
);
