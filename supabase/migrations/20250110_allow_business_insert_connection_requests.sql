-- Allow businesses to insert connection requests (for Business Map feature)
-- This enables businesses to proactively reach out to talent they find on the map

-- First, update status constraint to include 'declined' and 'discontinued' if needed
DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Find and drop the existing status check constraint
  SELECT conname INTO constraint_name
  FROM pg_constraint 
  WHERE conrelid = 'public.talent_connection_requests'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%'
  LIMIT 1;
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.talent_connection_requests DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END IF;
  
  -- Update any existing rows with 'declined' or 'discontinued' to use valid statuses first
  -- This is a safety measure in case there are existing rows
  UPDATE public.talent_connection_requests 
  SET status = 'rejected' 
  WHERE status NOT IN ('pending', 'accepted', 'rejected') 
    AND status IN ('declined', 'discontinued');
  
  -- Add new constraint with all valid statuses
  ALTER TABLE public.talent_connection_requests
  ADD CONSTRAINT talent_connection_requests_status_check 
  CHECK (status IN ('pending', 'accepted', 'rejected', 'declined', 'discontinued'));
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Status constraint already exists with different definition';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not update status constraint: %', SQLERRM;
END $$;

-- Allow businesses to insert connection requests
DO $$
BEGIN
  -- Drop existing policy if it exists (to recreate with correct logic)
  DROP POLICY IF EXISTS tcr_business_insert_own ON public.talent_connection_requests;
  
  -- Create policy for businesses to insert connection requests
  -- This allows businesses to proactively request connections to talents from the Business Map
  CREATE POLICY tcr_business_insert_own
    ON public.talent_connection_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (
      -- Business must own the business_id in the request
      -- This ensures only the business owner can create connection requests on behalf of their business
      -- The policy checks that the business_profile exists and belongs to the authenticated user
      EXISTS (
        SELECT 1
        FROM public.business_profiles bp
        WHERE bp.id = talent_connection_requests.business_id
          AND bp.user_id IS NOT NULL
          AND bp.user_id = auth.uid()
      )
      -- Note: We don't check talent_id ownership since businesses can request connections to any talent
      -- The talent will accept/decline based on their own preferences
      -- The talent_id must exist in talent_profiles, which is enforced by the foreign key constraint
    );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy tcr_business_insert_own already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create business insert policy: %', SQLERRM;
END $$;

-- Grant necessary permissions (if needed)
GRANT INSERT ON public.talent_connection_requests TO authenticated;


