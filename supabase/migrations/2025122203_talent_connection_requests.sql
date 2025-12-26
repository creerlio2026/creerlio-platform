-- Creerlio: Talent -> Business connection requests (permission-gated)
-- Flow:
-- - Talent requests a connection to a Business from /business/:slug
-- - Talent selects which profile sections to share (stored as JSON)
-- - Business can accept/reject
-- - On accept: Business creates talent_access_grants (required for messaging and talent data access)

create table if not exists public.talent_connection_requests (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talent_profiles(id) on delete cascade,
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  status text not null check (status in ('pending','accepted','rejected')) default 'pending',
  selected_sections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  responded_at timestamptz null,
  unique (talent_id, business_id)
);

create index if not exists talent_connection_requests_business_status_idx
  on public.talent_connection_requests(business_id, status, created_at);
create index if not exists talent_connection_requests_talent_status_idx
  on public.talent_connection_requests(talent_id, status, created_at);

alter table public.talent_connection_requests enable row level security;

-- Talent can create a request for themselves (no cold outreach without auth)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='talent_connection_requests' and policyname='tcr_talent_insert_own'
  ) then
    create policy tcr_talent_insert_own
      on public.talent_connection_requests
      for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.talent_profiles tp
          where tp.id = talent_connection_requests.talent_id
            and tp.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Talent can read their own requests
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='talent_connection_requests' and policyname='tcr_talent_select_own'
  ) then
    create policy tcr_talent_select_own
      on public.talent_connection_requests
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.talent_profiles tp
          where tp.id = talent_connection_requests.talent_id
            and tp.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Business can read requests sent to them
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='talent_connection_requests' and policyname='tcr_business_select_incoming'
  ) then
    create policy tcr_business_select_incoming
      on public.talent_connection_requests
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.business_profiles bp
          where bp.id = talent_connection_requests.business_id
            and bp.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Business can update status for incoming requests
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='talent_connection_requests' and policyname='tcr_business_update_incoming'
  ) then
    create policy tcr_business_update_incoming
      on public.talent_connection_requests
      for update
      to authenticated
      using (
        exists (
          select 1
          from public.business_profiles bp
          where bp.id = talent_connection_requests.business_id
            and bp.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.business_profiles bp
          where bp.id = talent_connection_requests.business_id
            and bp.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Ensure business owners can create grants for their accepted connections (required for messaging).
-- This is additive: only adds policy if missing. If table/policies differ in your project, you may need to adjust.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='talent_access_grants') then
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='talent_access_grants' and policyname='tag_business_insert_for_own_business'
    ) then
      create policy tag_business_insert_for_own_business
        on public.talent_access_grants
        for insert
        to authenticated
        with check (
          exists (
            select 1
            from public.business_profiles bp
            where bp.id = talent_access_grants.business_id
              and bp.user_id = auth.uid()
          )
        );
    end if;
  end if;
end $$;


