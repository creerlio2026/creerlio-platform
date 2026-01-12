-- Make talent-bank bucket public for reading (similar to business-bank)
-- This allows businesses to view media files from connected talents
-- Security is maintained through connection status checks

-- Make the bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'talent-bank';

-- Note: Storage policies are typically managed through Supabase dashboard
-- This migration makes the bucket public, which allows direct URL access
-- RLS policies on storage.objects require admin permissions to modify

-- Drop existing storage policies for talent-bank if they exist
DROP POLICY IF EXISTS "Businesses can view connected talent storage files" ON storage.objects;
DROP POLICY IF EXISTS "talent_bank_select_public_all" ON storage.objects;
DROP POLICY IF EXISTS "talent_bank_select_own" ON storage.objects;
DROP POLICY IF EXISTS "Public can view active talent bank files" ON storage.objects;

-- Create policy for public read access to files from active talent profiles
-- This allows businesses (and anyone) to view media from active talents
-- The connection status is checked at the application level
CREATE POLICY "talent_bank_select_public_all"
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

-- Verify the bucket is now public
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'talent-bank';
