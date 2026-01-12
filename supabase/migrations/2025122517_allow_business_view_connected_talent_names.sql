-- Allow businesses to view talent names for connected talents
-- This enables displaying actual talent names in the Business Connections section

-- Drop existing policies if they exist (to update them)
DROP POLICY IF EXISTS "Businesses can view all talent profiles" ON public.talent_profiles;
DROP POLICY IF EXISTS "Businesses can view connected talent profiles" ON public.talent_profiles;

-- Create updated policy that allows businesses to view connected talent profiles
-- This is more specific than "all talent profiles" and only allows viewing connected talents
CREATE POLICY "Businesses can view connected talent profiles"
ON public.talent_profiles FOR SELECT
USING (
  -- Allow if user is authenticated as a business
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'user_type' = 'business' 
         OR EXISTS (
           SELECT 1 FROM public.business_profiles bp
           WHERE bp.user_id = auth.uid()
         ))
  )
  AND (
    -- Allow viewing own profile (if they're also a talent)
    auth.uid() = talent_profiles.id
    OR
    -- Allow viewing connected talent profiles
    EXISTS (
      SELECT 1
      FROM public.talent_connection_requests tcr
      INNER JOIN public.business_profiles bp ON bp.id = tcr.business_id
      WHERE tcr.talent_id = talent_profiles.id
      AND bp.user_id = auth.uid()
      AND tcr.status IN ('accepted', 'pending')
    )
  )
);
