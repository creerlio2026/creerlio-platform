-- Creerlio: ensure authenticated users can create/read/update their own public.users row (additive)
-- This is needed when other tables (e.g. talent_bank_items.user_id) have an FK to public.users(id).
-- We DO NOT bypass RLS; we add minimal self-scoped policies.

do $$
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
    declare
      self_col text := 'id';
    begin
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
    end;

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


