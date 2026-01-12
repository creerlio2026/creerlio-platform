-- Allow businesses to access talent-bank storage files for connected talents
-- This enables viewing avatars, banners, and media files when businesses view talent profiles

-- Note: We cannot directly alter storage.objects table (it's a system table)
-- Storage policies are managed through Supabase Storage API or dashboard
-- This migration creates policies that can be applied via Supabase dashboard
-- or through the storage.objects table if you have proper permissions

-- Try to enable RLS on storage.objects (may fail if not owner, that's okay)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'storage' 
    AND table_name = 'objects'
  ) THEN
    -- Only try if table exists and we have permission
    BEGIN
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN
      -- If we can't alter it, that's okay - policies might be managed elsewhere
      RAISE NOTICE 'Could not enable RLS on storage.objects (may require admin permissions)';
    END;
  END IF;
END $$;

-- Drop existing policies for talent-bank bucket if they exist
DROP POLICY IF EXISTS "Businesses can view connected talent storage files" ON storage.objects;
DROP POLICY IF EXISTS "talent_bank_select_public_all" ON storage.objects;
DROP POLICY IF EXISTS "talent_bank_select_own" ON storage.objects;

-- Create policy that allows:
-- 1. Users to access their own files (original behavior - handled by default policies)
-- 2. Businesses to access files from talents they're connected to
CREATE POLICY "Businesses can view connected talent storage files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'talent-bank'
  AND (
    -- Users can always access their own files
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Businesses can access files from connected talents
    EXISTS (
      SELECT 1
      FROM talent_connection_requests tcr
      INNER JOIN business_profiles bp ON bp.id = tcr.business_id
      INNER JOIN talent_profiles tp ON tp.id = tcr.talent_id
      WHERE (storage.foldername(name))[1] = tp.user_id::text
      AND bp.user_id::text = auth.uid()::text
      AND tcr.status = 'accepted'
      AND tcr.business_id IS NOT NULL
      AND tcr.talent_id IS NOT NULL
    )
  )
);

-- Also allow public read access for files from active talent profiles
-- (This is a fallback for cases where signed URLs fail)
CREATE POLICY "Public can view active talent bank files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'talent-bank'
  AND EXISTS (
    SELECT 1
    FROM talent_profiles tp
    WHERE (storage.foldername(name))[1] = tp.user_id::text
    AND tp.is_active = true
  )
);
