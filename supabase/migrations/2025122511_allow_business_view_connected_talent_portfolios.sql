-- Allow businesses to view portfolios and media/attachments of talents they're connected to
-- This enables the "View Profile" feature for accepted connections AND pending connection requests

-- Drop existing policies if they exist (we'll add a more permissive one)
DROP POLICY IF EXISTS "Users can view own talent bank items" ON talent_bank_items;
DROP POLICY IF EXISTS "Users can view own talent bank items or connected business can view portfolio and media" ON talent_bank_items;

-- Create policy that allows:
-- 1. Users to view their own items (original behavior)
-- 2. Businesses to view portfolio items AND media/attachments of talents they're connected to (accepted OR pending)
CREATE POLICY "Users can view own talent bank items or connected business can view portfolio and media"
ON talent_bank_items FOR SELECT
USING (
  -- Original: Users can view their own items
  auth.uid()::text = user_id::text
  OR
  -- New: Businesses can view portfolio items AND media/attachments of connected talents
  -- This includes both accepted connections AND pending connection requests (so businesses can review before accepting)
  (
    EXISTS (
      SELECT 1
      FROM talent_connection_requests tcr
      INNER JOIN business_profiles bp ON bp.id = tcr.business_id
      INNER JOIN talent_profiles tp ON tp.id = tcr.talent_id
      WHERE tp.user_id::text = talent_bank_items.user_id::text
      AND bp.user_id::text = auth.uid()::text
      AND tcr.status IN ('accepted', 'pending')
      AND tcr.business_id IS NOT NULL
      AND tcr.talent_id IS NOT NULL
    )
  )
);
