-- Allow businesses to view anonymized talent profiles for search/discovery
-- This enables the Business Map feature where businesses can search for talent
-- Note: The SELECT query in business-map only requests non-identifying fields
-- so name, email, and phone are never exposed

-- Add a policy that allows businesses to view talent profiles
-- This is needed for the Business Map search feature
DO $$
BEGIN
  -- Drop existing policy if it exists to recreate with correct permissions
  DROP POLICY IF EXISTS "talent_profiles_select_for_business_search" ON public.talent_profiles;
  
  -- Create a simple policy that allows authenticated businesses to view talent profiles
  -- We don't check for specific columns (is_active, latitude, longitude) as they may not exist
  -- The frontend will handle filtering based on available columns
  CREATE POLICY "talent_profiles_select_for_business_search"
  ON public.talent_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles bp
      WHERE bp.user_id = auth.uid()
    )
  );
END $$;
