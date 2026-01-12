# Storage RLS Validation Checklist

## Pre-Flight Checks
- [ ] `business-bank` bucket exists in Supabase Dashboard → Storage
- [ ] Bucket is set to **PRIVATE** (not public)
- [ ] `FIX_STORAGE_RLS_BUSINESS_BANK.sql` has been executed successfully

## Policy Verification
Run this SQL to verify policies exist:
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE 'business_bank%'
ORDER BY policyname;
```

Expected policies:
- [ ] `business_bank_insert_own` (INSERT)
- [ ] `business_bank_select_authenticated` (SELECT for authenticated)
- [ ] `business_bank_select_public` (SELECT for anon)
- [ ] `business_bank_update_own` (UPDATE)
- [ ] `business_bank_delete_own` (DELETE)

## Functional Tests

### Test 1: Upload Logo
1. Navigate to `/dashboard/business/bank`
2. Click "Upload Files" or drag & drop a logo image
3. **Expected:** Upload succeeds, no console errors
4. **Verify:** File appears in Supabase Dashboard → Storage → business-bank → `business/{your_user_id}/`

### Test 2: Upload Image
1. Upload a regular image file
2. **Expected:** Upload succeeds
3. **Verify:** Image appears in items list with thumbnail

### Test 3: Upload Video
1. Upload a video file
2. **Expected:** Upload succeeds
3. **Verify:** Video appears in items list

### Test 4: Create Text Block
1. Fill in "Add Text Block" form
2. Click "Create Text Block"
3. **Expected:** Text block created, form resets
4. **Verify:** Text block appears in items list

### Test 5: Create Link
1. Fill in "Add Link" form
2. Click "Add Link"
3. **Expected:** Link created, form resets
4. **Verify:** Link appears in items list

## Error Checks
- [ ] No "Storage upload failed" errors in console
- [ ] No "row-level security policy" errors
- [ ] No 403 Forbidden errors on storage API calls
- [ ] No 400 Bad Request errors

## Path Structure Verification
1. Go to Supabase Dashboard → Storage → business-bank
2. **Expected structure:**
   ```
   business-bank/
     business/
       {your_user_id}/
         {timestamp}-{random}.jpg
         {timestamp}-{random}.png
   ```

## If Tests Fail
1. Check browser console for specific error messages
2. Verify `user_id` matches `auth.uid()` in the path
3. Run policy verification SQL above
4. Check Supabase logs: Dashboard → Logs → API Logs
