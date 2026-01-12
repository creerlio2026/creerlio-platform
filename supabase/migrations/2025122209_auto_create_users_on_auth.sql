-- ============================================
-- Auto-create users row on auth signup
-- This ensures every authenticated user has a corresponding users row
-- ============================================

-- Create a function to handle new user creation
-- SECURITY DEFINER allows this function to access auth.users and insert into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to insert a users row for the new auth user
  -- Copy email from auth.users if available, use empty string as fallback
  -- Set role to 'talent' as default (required NOT NULL field)
  -- Use ON CONFLICT to handle race conditions
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, COALESCE(NEW.email, ''), 'talent')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to auto-create public.users row
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also handle existing users who might not have a row yet
-- This is a one-time backfill for existing auth users
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  -- Count auth users without a public.users row
  SELECT COUNT(*) INTO missing_count
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = au.id
  );
  
  IF missing_count > 0 THEN
    -- Insert missing users rows
    -- Copy email from auth.users, use empty string as fallback if null
    -- Set role to 'talent' as default (required NOT NULL field)
    INSERT INTO public.users (id, email, role)
    SELECT au.id, COALESCE(au.email, ''), 'talent'
    FROM auth.users au
    WHERE NOT EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = au.id
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created % missing users rows', missing_count;
  ELSE
    RAISE NOTICE 'All auth users already have public.users rows';
  END IF;
END $$;

-- ============================================
-- Summary
-- ============================================
-- This migration:
-- 1. Creates a trigger function to auto-create public.users row on auth signup
-- 2. Creates the trigger on auth.users
-- 3. Backfills existing auth users who don't have a public.users row
--
-- This ensures the foreign key constraint from talent_bank_items.user_id
-- to public.users.id will always be satisfied.
