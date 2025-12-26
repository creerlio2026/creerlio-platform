-- Creerlio: Talent ↔ Business messaging (additive, minimal)
-- Requirements:
-- - One conversation per (talent_id, business_id)
-- - Conversations created lazily (on first message)
-- - Messaging allowed only with an ACTIVE talent_access_grants row:
--   expires_at > now() AND revoked_at IS NULL
-- - Do NOT bypass RLS

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talent_profiles(id) on delete cascade,
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (talent_id, business_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_type text check (sender_type in ('talent', 'business')),
  sender_user_id uuid not null,
  body text not null,
  created_at timestamptz default now()
);

create index if not exists conversations_talent_id_idx on public.conversations(talent_id);
create index if not exists conversations_business_id_idx on public.conversations(business_id);
create index if not exists messages_conversation_id_created_at_idx on public.messages(conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Helper: active connection exists for the conversation pair
-- NOTE: Uses existing talent_access_grants table; does not modify it.
create or replace function public._has_active_talent_access_for_pair(_talent_id uuid, _business_id uuid)
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

-- Conversations: SELECT only if you're the talent owner or business owner AND grant is active
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='conversations' and policyname='conversations_select_with_active_grant'
  ) then
    create policy conversations_select_with_active_grant
      on public.conversations
      for select
      to authenticated
      using (
        public._has_active_talent_access_for_pair(talent_id, business_id)
        and (
          exists (select 1 from public.talent_profiles tp where tp.id = conversations.talent_id and tp.user_id = auth.uid())
          or exists (select 1 from public.business_profiles bp where bp.id = conversations.business_id and bp.user_id = auth.uid())
        )
      );
  end if;
end $$;

-- Conversations: INSERT only if you're the talent owner or business owner AND grant is active
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='conversations' and policyname='conversations_insert_with_active_grant'
  ) then
    create policy conversations_insert_with_active_grant
      on public.conversations
      for insert
      to authenticated
      with check (
        public._has_active_talent_access_for_pair(talent_id, business_id)
        and (
          exists (select 1 from public.talent_profiles tp where tp.id = conversations.talent_id and tp.user_id = auth.uid())
          or exists (select 1 from public.business_profiles bp where bp.id = conversations.business_id and bp.user_id = auth.uid())
        )
      );
  end if;
end $$;

-- Messages: SELECT only if you can SELECT the parent conversation (and grant is active)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='messages_select_via_conversation'
  ) then
    create policy messages_select_via_conversation
      on public.messages
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.conversations c
          where c.id = messages.conversation_id
            and public._has_active_talent_access_for_pair(c.talent_id, c.business_id)
            and (
              exists (select 1 from public.talent_profiles tp where tp.id = c.talent_id and tp.user_id = auth.uid())
              or exists (select 1 from public.business_profiles bp where bp.id = c.business_id and bp.user_id = auth.uid())
            )
        )
      );
  end if;
end $$;

-- Messages: INSERT only if sender matches your role AND you can access the parent conversation (and grant is active)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='messages_insert_with_active_grant_and_role'
  ) then
    create policy messages_insert_with_active_grant_and_role
      on public.messages
      for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.conversations c
          where c.id = messages.conversation_id
            and public._has_active_talent_access_for_pair(c.talent_id, c.business_id)
            and (
              (messages.sender_type = 'talent'
                and exists (select 1 from public.talent_profiles tp where tp.id = c.talent_id and tp.user_id = auth.uid())
              )
              or
              (messages.sender_type = 'business'
                and exists (select 1 from public.business_profiles bp where bp.id = c.business_id and bp.user_id = auth.uid())
              )
            )
        )
      );
  end if;
end $$;


