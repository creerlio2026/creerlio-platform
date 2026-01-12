-- ============================================
-- Storage RLS Policies for business-bank bucket
-- Run this in Supabase SQL Editor
-- ============================================

-- Note: Storage policies are created via the Supabase Dashboard or Storage API
-- This SQL file documents what policies should exist

-- Policy 1: Authenticated users can upload to their own folder
-- Policy Name: "Users can upload to own folder"
-- Bucket: business-bank
-- Operation: INSERT
-- Policy: (bucket_id = 'business-bank') AND (auth.uid()::text = (storage.foldername(name))[1])

-- Policy 2: Authenticated users can read their own files
-- Policy Name: "Users can read own files"
-- Bucket: business-bank
-- Operation: SELECT
-- Policy: (bucket_id = 'business-bank') AND (auth.uid()::text = (storage.foldername(name))[1])

-- Policy 3: Authenticated users can update their own files
-- Policy Name: "Users can update own files"
-- Bucket: business-bank
-- Operation: UPDATE
-- Policy: (bucket_id = 'business-bank') AND (auth.uid()::text = (storage.foldername(name))[1])

-- Policy 4: Authenticated users can delete their own files
-- Policy Name: "Users can delete own files"
-- Bucket: business-bank
-- Operation: DELETE
-- Policy: (bucket_id = 'business-bank') AND (auth.uid()::text = (storage.foldername(name))[1])

-- ============================================
-- To create these policies:
-- 1. Go to Supabase Dashboard → Storage → Policies
-- 2. Select the 'business-bank' bucket
-- 3. Click "New Policy"
-- 4. For each policy above, use the settings:
--    - Policy Name: (as shown above)
--    - Allowed Operation: (INSERT/SELECT/UPDATE/DELETE)
--    - Policy Definition: Copy the Policy expression above
-- ============================================

-- Alternative: Make bucket public (simpler but less secure)
-- In Dashboard → Storage → business-bank → Settings
-- Toggle "Public bucket" to ON
