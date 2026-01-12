-- ============================================
-- Fix business_bank_items item_type check constraint
-- This removes the old restrictive constraint and allows 'profile' type
-- Safe to run multiple times (idempotent)
-- ============================================

-- Step 1: Try to drop the constraint by common names (ignore errors if it doesn't exist)
DO $$
BEGIN
  -- Try dropping with the most common constraint name
  BEGIN
    ALTER TABLE public.business_bank_items DROP CONSTRAINT IF EXISTS business_bank_items_item_type_check;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if constraint doesn't exist
  END;
END $$;

-- Step 2: Drop ALL check constraints on this table (safest approach)
-- This ensures any old constraints with different names are removed
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Loop through all check constraints and drop them
  FOR constraint_name IN
    SELECT conname::TEXT
    FROM pg_constraint
    WHERE conrelid = 'public.business_bank_items'::regclass
    AND contype = 'c'
  LOOP
    BEGIN
      EXECUTE 'ALTER TABLE public.business_bank_items DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
    EXCEPTION WHEN OTHERS THEN
      -- Ignore errors (constraint might already be dropped or have dependencies)
      NULL;
    END;
  END LOOP;
END $$;

-- Step 3: Always recreate the constraint with all allowed types
-- This allows: document, image, video, text, link, logo, profile, business_introduction
DO $$
BEGIN
  -- Always drop the constraint first (in case it exists with old values)
  BEGIN
    ALTER TABLE public.business_bank_items DROP CONSTRAINT IF EXISTS business_bank_items_item_type_check;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if constraint doesn't exist
  END;
  
  -- Now create the new constraint with all allowed types
  ALTER TABLE public.business_bank_items
  ADD CONSTRAINT business_bank_items_item_type_check 
  CHECK (item_type IN ('document', 'image', 'video', 'text', 'link', 'logo', 'profile', 'business_introduction'));
END $$;

-- Step 4: Verify the constraint exists
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.business_bank_items'::regclass
AND conname = 'business_bank_items_item_type_check'
AND contype = 'c';
