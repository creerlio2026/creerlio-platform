-- Grant Admin Access to simon060965@gmail.com
-- Run this in Supabase SQL Editor

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_admin}',
  'true'::jsonb
)
WHERE email = 'simon060965@gmail.com';

-- Verify the update
SELECT 
  id,
  email,
  raw_user_meta_data->>'is_admin' as is_admin,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'simon060965@gmail.com';

