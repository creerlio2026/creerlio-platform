-- ============================================
-- Verify RLS policy for INSERT on business_bank_items
-- This will test if the RLS policy is working correctly
-- ============================================

-- Check the current user
SELECT 
    auth.uid() AS current_user_id,
    auth.role() AS current_role;

-- Test the INSERT policy directly
-- This should work if RLS is configured correctly
DO $$
DECLARE
    test_user_id UUID;
    test_insert_id BIGINT;
BEGIN
    -- Get the current authenticated user
    test_user_id := auth.uid();
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No authenticated user - cannot test RLS policy';
        RAISE NOTICE 'Please run this from Supabase Dashboard SQL Editor while logged in, or from a client with auth context';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing INSERT with user_id: %', test_user_id;
    
    -- Try to insert a test row
    BEGIN
        INSERT INTO public.business_bank_items (
            user_id,
            item_type,
            title,
            metadata
        ) VALUES (
            test_user_id,
            'profile',
            'Test Profile RLS Check',
            '{}'::jsonb
        ) RETURNING id INTO test_insert_id;
        
        RAISE NOTICE 'SUCCESS: INSERT was allowed by RLS policy. Inserted row ID: %', test_insert_id;
        
        -- Clean up - delete the test row
        DELETE FROM public.business_bank_items 
        WHERE id = test_insert_id;
        
        RAISE NOTICE 'Test row cleaned up';
        
    EXCEPTION 
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'FAILED: RLS policy blocked the INSERT - insufficient_privilege';
        WHEN OTHERS THEN
            RAISE NOTICE 'FAILED: INSERT error - %', SQLERRM;
            RAISE NOTICE 'Error Code: %', SQLSTATE;
    END;
END $$;

-- Check if there are any other constraints or triggers that might be blocking
SELECT 
    'Constraints' AS check_type,
    COUNT(*) AS count
FROM pg_constraint
WHERE conrelid = 'public.business_bank_items'::regclass

UNION ALL

SELECT 
    'Triggers' AS check_type,
    COUNT(*) AS count
FROM pg_trigger
WHERE tgrelid = 'public.business_bank_items'::regclass
AND tgisinternal = false;
