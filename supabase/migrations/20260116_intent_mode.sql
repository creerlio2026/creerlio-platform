-- Intent Mode: shared intent signals for talent + business
create table if not exists public.intent_modes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  profile_type text not null check (profile_type in ('talent', 'business')),
  profile_id uuid not null,
  intent_status text not null,
  visibility boolean not null default false,
  constraints jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_type, profile_id)
);

create index if not exists idx_intent_modes_visibility on public.intent_modes (visibility);
create index if not exists idx_intent_modes_profile on public.intent_modes (profile_type, profile_id);
create index if not exists idx_intent_modes_status on public.intent_modes (profile_type, intent_status);

create table if not exists public.intent_events (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid,
  user_id uuid not null,
  profile_type text not null check (profile_type in ('talent', 'business')),
  profile_id uuid not null,
  event_type text not null,
  created_at timestamptz not null default now()
);

alter table public.intent_modes enable row level security;
alter table public.intent_events enable row level security;

-- Intent modes: owner can write, everyone can read visible intents
create policy "Intent modes are readable when visible or by owner"
  on public.intent_modes for select
  using (visibility = true or user_id = auth.uid());

create policy "Intent modes are insertable by owner"
  on public.intent_modes for insert
  with check (user_id = auth.uid());

create policy "Intent modes are updatable by owner"
  on public.intent_modes for update
  using (user_id = auth.uid());

create policy "Intent modes are deletable by owner"
  on public.intent_modes for delete
  using (user_id = auth.uid());

-- Intent events: owner can read/write
create policy "Intent events are readable by owner"
  on public.intent_events for select
  using (user_id = auth.uid());

create policy "Intent events are insertable by owner"
  on public.intent_events for insert
  with check (user_id = auth.uid());

create policy "Intent events are updatable by owner"
  on public.intent_events for update
  using (user_id = auth.uid());

create policy "Intent events are deletable by owner"
  on public.intent_events for delete
  using (user_id = auth.uid());

-- Keep updated_at fresh
drop trigger if exists update_intent_modes_updated_at on public.intent_modes;
create trigger update_intent_modes_updated_at
  before update on public.intent_modes
  for each row
  execute function public.update_updated_at_column();
