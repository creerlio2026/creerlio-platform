-- Add 'waiting_for_review' status to talent_connection_requests
-- This allows talents to mark connection requests for review later

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
  
  -- Add new constraint with all valid statuses including 'waiting_for_review'
  ALTER TABLE public.talent_connection_requests
  ADD CONSTRAINT talent_connection_requests_status_check 
  CHECK (status IN ('pending', 'accepted', 'rejected', 'declined', 'discontinued', 'waiting_for_review'));
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Status constraint already exists with different definition';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not update status constraint: %', SQLERRM;
END $$;
