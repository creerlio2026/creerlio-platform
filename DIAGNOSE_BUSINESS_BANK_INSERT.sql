-- ============================================
-- Diagnose business_bank_items INSERT issues
-- Run this to check the actual table structure and constraints
-- ============================================

-- 1. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'business_bank_items'
ORDER BY ordinal_position;

-- 2. Check all constraints on the table
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.business_bank_items'::regclass
ORDER BY contype, conname;

-- 3. Check RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'business_bank_items';

-- 4. Check if there are any triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'business_bank_items';

-- 5. Test a simple INSERT to see what error we get
-- (This will fail but show us the exact error)
DO $$
DECLARE
    test_user_id UUID := auth.uid();
BEGIN
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No authenticated user - cannot test INSERT';
    ELSE
        BEGIN
            INSERT INTO public.business_bank_items (user_id, item_type, title, metadata)
            VALUES (test_user_id, 'profile', 'Test Profile', '{}'::jsonb);
            RAISE NOTICE 'Test INSERT succeeded';
            ROLLBACK; -- Rollback the test insert
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Test INSERT failed: %', SQLERRM;
        END;
    END IF;
END $$;
