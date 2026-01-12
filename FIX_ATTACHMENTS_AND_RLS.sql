-- ============================================
-- COMPLETE FIX FOR ATTACHMENTS AND RLS
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- ============================================
-- MIGRATION 1: Users RLS Policies
-- ============================================
-- File: 2025122208_users_self_row.sql
-- Purpose: Sets up RLS so authenticated users can manage their own users row

do $$
declare
  self_col text := 'id';
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'users'
  ) then
    -- Determine which column to use for self-scoped policies (common variants: id, user_id)
    -- Default: id
    -- If id doesn't exist but user_id exists: use user_id
    -- If neither exists: skip (schema is incompatible with this helper migration)
    if not exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='users' and column_name='id'
    ) and exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='users' and column_name='user_id'
    ) then
      self_col := 'user_id';
    end if;

    if not exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='users' and column_name=self_col
    ) then
      -- No compatible self id column found; do nothing.
      return;
    end if;

    begin
      execute 'alter table public.users enable row level security';
    exception when others then
      -- ignore
    end;

    -- SELECT own row
    if not exists (
      select 1 from pg_policies
      where schemaname='public' and tablename='users' and policyname='users_select_own'
    ) then
      execute format($pol$
        create policy users_select_own
          on public.users
          for select
          to authenticated
          using (%I = auth.uid())
      $pol$, self_col);
    end if;

    -- INSERT own row
    if not exists (
      select 1 from pg_policies
      where schemaname='public' and tablename='users' and policyname='users_insert_own'
    ) then
      execute format($pol$
        create policy users_insert_own
          on public.users
          for insert
          to authenticated
          with check (%I = auth.uid())
      $pol$, self_col);
    end if;

    -- UPDATE own row
    if not exists (
      select 1 from pg_policies
      where schemaname='public' and tablename='users' and policyname='users_update_own'
    ) then
      execute format($pol$
        create policy users_update_own
          on public.users
          for update
          to authenticated
          using (%I = auth.uid())
          with check (%I = auth.uid())
      $pol$, self_col, self_col);
    end if;
  end if;
end $$;

-- ============================================
-- MIGRATION 2: Auto-create users row on auth signup
-- ============================================
-- File: 2025122209_auto_create_users_on_auth.sql
-- Purpose: Automatically creates public.users row when auth.users row is created

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
-- MIGRATION 3: Fix talent_profiles RLS policies
-- ============================================
-- File: 2025122210_fix_talent_profiles_rls.sql
-- Purpose: Removes circular dependency, allows users to manage their own profiles

-- Drop existing policies
DROP POLICY IF EXISTS "Talent profiles are publicly readable" ON talent_profiles;
DROP POLICY IF EXISTS "Users can manage own talent profile" ON talent_profiles;
DROP POLICY IF EXISTS "talent_profiles_select_own" ON talent_profiles;
DROP POLICY IF EXISTS "talent_profiles_insert_own" ON talent_profiles;
DROP POLICY IF EXISTS "talent_profiles_update_own" ON talent_profiles;
DROP POLICY IF EXISTS "talent_profiles_delete_own" ON talent_profiles;
DROP POLICY IF EXISTS "talent_profiles_select_public" ON talent_profiles;

-- Enable RLS
ALTER TABLE IF EXISTS talent_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own talent profile directly by matching id to auth.uid()
CREATE POLICY "talent_profiles_select_own"
ON talent_profiles
FOR SELECT
TO authenticated
USING (id::text = auth.uid()::text);

-- Also allow public read for active profiles (for matching/search)
-- Only create this policy if is_active column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'talent_profiles' 
      AND column_name = 'is_active'
  ) THEN
    CREATE POLICY "talent_profiles_select_public"
    ON talent_profiles
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);
  ELSE
    -- If is_active doesn't exist, allow public read of all profiles
    CREATE POLICY "talent_profiles_select_public"
    ON talent_profiles
    FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;
END $$;

-- INSERT: Users can insert their own talent profile
CREATE POLICY "talent_profiles_insert_own"
ON talent_profiles
FOR INSERT
TO authenticated
WITH CHECK (id::text = auth.uid()::text);

-- UPDATE: Users can update their own talent profile
CREATE POLICY "talent_profiles_update_own"
ON talent_profiles
FOR UPDATE
TO authenticated
USING (id::text = auth.uid()::text)
WITH CHECK (id::text = auth.uid()::text);

-- DELETE: Users can delete their own talent profile
CREATE POLICY "talent_profiles_delete_own"
ON talent_profiles
FOR DELETE
TO authenticated
USING (id::text = auth.uid()::text);

-- ============================================
-- MIGRATION 4: Fix Talent Bank Items RLS Policies
-- ============================================
-- File: 2025122401_fix_talent_bank_rls.sql
-- Purpose: Ensures user_id matches auth.uid() (UUID format)

-- First, check if talent_bank_items table exists and get its structure
DO $$
DECLARE
  user_id_type text;
  has_table boolean;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'talent_bank_items'
  ) INTO has_table;

  IF has_table THEN
    -- Get the data type of user_id column
    SELECT data_type INTO user_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'talent_bank_items' 
      AND column_name = 'user_id';

    RAISE NOTICE 'talent_bank_items.user_id type: %', user_id_type;
  END IF;
END $$;

-- Drop existing RLS policies on talent_bank_items if they exist (both old and new names)
DROP POLICY IF EXISTS "Users can view own talent bank items" ON talent_bank_items;
DROP POLICY IF EXISTS "Users can insert own talent bank items" ON talent_bank_items;
DROP POLICY IF EXISTS "Users can update own talent bank items" ON talent_bank_items;
DROP POLICY IF EXISTS "Users can delete own talent bank items" ON talent_bank_items;
DROP POLICY IF EXISTS "users_select_own_talent_bank_items" ON talent_bank_items;
DROP POLICY IF EXISTS "users_insert_own_talent_bank_items" ON talent_bank_items;
DROP POLICY IF EXISTS "users_update_own_talent_bank_items" ON talent_bank_items;
DROP POLICY IF EXISTS "users_delete_own_talent_bank_items" ON talent_bank_items;

-- Enable RLS on talent_bank_items
ALTER TABLE IF EXISTS talent_bank_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies that work with UUID (auth.uid() returns UUID)
-- These policies assume user_id is stored as UUID (text) to match auth.uid()

-- SELECT: Users can view their own talent bank items
CREATE POLICY "users_select_own_talent_bank_items"
ON talent_bank_items
FOR SELECT
TO authenticated
USING (user_id::text = auth.uid()::text);

-- INSERT: Users can insert their own talent bank items
CREATE POLICY "users_insert_own_talent_bank_items"
ON talent_bank_items
FOR INSERT
TO authenticated
WITH CHECK (user_id::text = auth.uid()::text);

-- UPDATE: Users can update their own talent bank items
CREATE POLICY "users_update_own_talent_bank_items"
ON talent_bank_items
FOR UPDATE
TO authenticated
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- DELETE: Users can delete their own talent bank items
CREATE POLICY "users_delete_own_talent_bank_items"
ON talent_bank_items
FOR DELETE
TO authenticated
USING (user_id::text = auth.uid()::text);

-- ============================================
-- Data Integrity Check: Find any problematic rows
-- ============================================

-- Check for any talent_bank_items with user_id that looks like an email
-- (This should not exist, but we check for data integrity)
DO $$
DECLARE
  email_count integer;
BEGIN
  SELECT COUNT(*) INTO email_count
  FROM talent_bank_items
  WHERE user_id::text LIKE '%@%';
  
  IF email_count > 0 THEN
    RAISE WARNING 'Found % rows in talent_bank_items with user_id containing @ (email format). These need to be fixed.', email_count;
  ELSE
    RAISE NOTICE 'No email-formatted user_id found in talent_bank_items. Good!';
  END IF;
END $$;

-- ============================================
-- Ensure public.users table has proper RLS
-- ============================================

-- Enable RLS on users table if not already enabled
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- Create/update policies for users table to work with UUID
DO $$
BEGIN
  -- Check if id column exists and is UUID type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'id'
      AND data_type = 'uuid'
  ) THEN
    -- Users table uses UUID id (matches auth.uid())
    -- Policies should already be set up by migration 1
    RAISE NOTICE 'Users table uses UUID id. RLS policies should be compatible.';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'id'
  ) THEN
    -- Users table uses non-UUID id (integer or text)
    -- Need to ensure policies work correctly
    RAISE NOTICE 'Users table id is not UUID. Ensure RLS policies convert correctly.';
  END IF;
END $$;

-- ============================================
-- COMPLETE
-- ============================================
-- All migrations have been applied.
-- 
-- What was fixed:
-- 1. Users table RLS policies (allows authenticated users to manage their own row)
-- 2. Auto-create users row on signup (trigger + backfill)
-- 3. Talent profiles RLS (removed circular dependency)
-- 4. Talent bank items RLS (allows portfolio saves with attachments)
--
-- Next steps:
-- 1. Test saving a portfolio with attachments
-- 2. Verify attachments appear in View Portfolio
-- 3. Check console for any remaining 403 errors
