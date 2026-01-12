-- Allow talents to update connection requests (accept/reject incoming requests from businesses)
-- This enables talents to accept or reject connection requests sent to them by businesses

DO $$
BEGIN
  -- Drop existing policy if it exists (to recreate with correct logic)
  DROP POLICY IF EXISTS tcr_talent_update_own ON public.talent_connection_requests;
  
  -- Create policy for talents to update their own incoming connection requests
  -- This allows talents to accept/reject connection requests where they are the recipient (talent_id matches their profile)
  CREATE POLICY tcr_talent_update_own
    ON public.talent_connection_requests
    FOR UPDATE
    TO authenticated
    USING (
      -- Talent can update requests where they are the recipient (talent_id matches their profile)
      EXISTS (
        SELECT 1
        FROM public.talent_profiles tp
        WHERE tp.id = talent_connection_requests.talent_id
          AND tp.user_id IS NOT NULL
          AND tp.user_id = auth.uid()
      )
    )
    WITH CHECK (
      -- After update, ensure the talent_id still matches their profile (security check)
      EXISTS (
        SELECT 1
        FROM public.talent_profiles tp
        WHERE tp.id = talent_connection_requests.talent_id
          AND tp.user_id IS NOT NULL
          AND tp.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy tcr_talent_update_own already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create talent update policy: %', SQLERRM;
END $$;

-- Grant necessary permissions (if needed)
GRANT UPDATE ON public.talent_connection_requests TO authenticated;
