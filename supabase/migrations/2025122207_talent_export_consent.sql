-- Creerlio: Talent export/print consent (additive)
-- Goal: Businesses cannot "export/print" Talent content via in-app controls unless Talent explicitly approves.
-- Notes:
-- - Browsers cannot fully prevent screenshots; this system focuses on in-app export/print gating + audit logging.
-- - Messaging/UX can warn on attempts and require consent.

create table if not exists public.talent_export_consent_requests (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talent_profiles(id) on delete cascade,
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  requested_by_user_id uuid not null,
  request_reason text,
  scope text not null default 'portfolio' check (scope in ('portfolio','attachment','other')),
  scope_ref jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','denied','cancelled')),
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  responded_by_user_id uuid,
  expires_at timestamptz
);

create index if not exists talent_export_consent_requests_talent_idx on public.talent_export_consent_requests(talent_id, requested_at desc);
create index if not exists talent_export_consent_requests_business_idx on public.talent_export_consent_requests(business_id, requested_at desc);
create index if not exists talent_export_consent_requests_status_idx on public.talent_export_consent_requests(status);

create table if not exists public.talent_export_consent_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.talent_export_consent_requests(id) on delete set null,
  talent_id uuid not null references public.talent_profiles(id) on delete cascade,
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  actor_type text not null check (actor_type in ('talent','business','system')),
  actor_user_id uuid,
  event_type text not null check (event_type in (
    'request_created',
    'request_cancelled',
    'approved',
    'denied',
    'print_attempt_blocked',
    'print_attempt_allowed',
    'screenshot_attempt_reported'
  )),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists talent_export_consent_events_req_idx on public.talent_export_consent_events(request_id, created_at);
create index if not exists talent_export_consent_events_pair_idx on public.talent_export_consent_events(talent_id, business_id, created_at);

alter table public.talent_export_consent_requests enable row level security;
alter table public.talent_export_consent_events enable row level security;

-- Helper: active connection exists for pair (reuses messaging helper if present, otherwise checks directly).
create or replace function public._has_active_talent_access_for_pair_v2(_talent_id uuid, _business_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.talent_access_grants g
    where g.talent_id = _talent_id
      and g.business_id = _business_id
      and g.revoked_at is null
      and g.expires_at > now()
  );
$$;

-- Requests: SELECT for the talent owner or business owner (and must have active grant for the pair)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='talent_export_consent_requests' and policyname='export_requests_select'
  ) then
    create policy export_requests_select
      on public.talent_export_consent_requests
      for select
      to authenticated
      using (
        public._has_active_talent_access_for_pair_v2(talent_id, business_id)
        and (
          exists (select 1 from public.talent_profiles tp where tp.id = talent_export_consent_requests.talent_id and tp.user_id = auth.uid())
          or exists (select 1 from public.business_profiles bp where bp.id = talent_export_consent_requests.business_id and bp.user_id = auth.uid())
        )
      );
  end if;
end $$;

-- Requests: INSERT by business owner only, with active grant
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='talent_export_consent_requests' and policyname='export_requests_insert_by_business'
  ) then
    create policy export_requests_insert_by_business
      on public.talent_export_consent_requests
      for insert
      to authenticated
      with check (
        public._has_active_talent_access_for_pair_v2(talent_id, business_id)
        and exists (select 1 from public.business_profiles bp where bp.id = talent_export_consent_requests.business_id and bp.user_id = auth.uid())
      );
  end if;
end $$;

-- Requests: UPDATE by talent owner only (approve/deny/cancel), with active grant
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='talent_export_consent_requests' and policyname='export_requests_update_by_talent'
  ) then
    create policy export_requests_update_by_talent
      on public.talent_export_consent_requests
      for update
      to authenticated
      using (
        public._has_active_talent_access_for_pair_v2(talent_id, business_id)
        and exists (select 1 from public.talent_profiles tp where tp.id = talent_export_consent_requests.talent_id and tp.user_id = auth.uid())
      )
      with check (
        public._has_active_talent_access_for_pair_v2(talent_id, business_id)
        and exists (select 1 from public.talent_profiles tp where tp.id = talent_export_consent_requests.talent_id and tp.user_id = auth.uid())
      );
  end if;
end $$;

-- Events: SELECT for talent owner or business owner (must have active grant)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='talent_export_consent_events' and policyname='export_events_select'
  ) then
    create policy export_events_select
      on public.talent_export_consent_events
      for select
      to authenticated
      using (
        public._has_active_talent_access_for_pair_v2(talent_id, business_id)
        and (
          exists (select 1 from public.talent_profiles tp where tp.id = talent_export_consent_events.talent_id and tp.user_id = auth.uid())
          or exists (select 1 from public.business_profiles bp where bp.id = talent_export_consent_events.business_id and bp.user_id = auth.uid())
        )
      );
  end if;
end $$;

-- Events: INSERT by either party (business can log blocked attempts; talent can log approvals/denials)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='talent_export_consent_events' and policyname='export_events_insert'
  ) then
    create policy export_events_insert
      on public.talent_export_consent_events
      for insert
      to authenticated
      with check (
        public._has_active_talent_access_for_pair_v2(talent_id, business_id)
        and (
          exists (select 1 from public.talent_profiles tp where tp.id = talent_export_consent_events.talent_id and tp.user_id = auth.uid())
          or exists (select 1 from public.business_profiles bp where bp.id = talent_export_consent_events.business_id and bp.user_id = auth.uid())
        )
      );
  end if;
end $$;


