-- Creerlio: Talent Portfolio Share Configuration & Snapshot System
-- Implements the three-layer architecture:
-- 1. Talent Portfolio (source of truth)
-- 2. Share Configuration (filter layer)
-- 3. Talent Template Snapshot (render layer)

-- ============================================
-- SHARE CONFIGURATION TABLE
-- ============================================
-- Stores per-section share toggles for each talent
create table if not exists public.talent_portfolio_share_config (
  id uuid primary key default gen_random_uuid(),
  talent_profile_id uuid not null references public.talent_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Share toggles per section
  share_intro boolean not null default false,
  share_social boolean not null default false,
  share_skills boolean not null default false,
  share_experience boolean not null default false,
  share_education boolean not null default false,
  share_referees boolean not null default false,
  share_projects boolean not null default false,
  share_attachments boolean not null default false,
  
  -- Media sharing
  share_avatar boolean not null default false,
  share_banner boolean not null default false,
  share_intro_video boolean not null default false,
  
  -- Selected media paths (only shared media)
  selected_avatar_path text,
  selected_banner_path text,
  selected_intro_video_id integer,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique (talent_profile_id)
);

create index if not exists talent_portfolio_share_config_talent_idx 
  on public.talent_portfolio_share_config(talent_profile_id);
create index if not exists talent_portfolio_share_config_user_idx 
  on public.talent_portfolio_share_config(user_id);

-- ============================================
-- PORTFOLIO SNAPSHOT TABLE
-- ============================================
-- Immutable snapshots of shared portfolio data for business viewing
create table if not exists public.talent_portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  talent_profile_id uuid not null references public.talent_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Template selection
  template_id text not null,
  
  -- Snapshot payload (immutable JSON)
  shared_payload jsonb not null,
  
  -- Metadata
  snapshot_timestamp timestamptz not null default now(),
  version integer not null default 1,
  
  -- Optional: Link to specific business (if snapshot was created for a connection)
  business_id uuid references public.business_profiles(id) on delete set null,
  
  created_at timestamptz not null default now()
);

create index if not exists talent_portfolio_snapshots_talent_idx 
  on public.talent_portfolio_snapshots(talent_profile_id, snapshot_timestamp desc);
create index if not exists talent_portfolio_snapshots_user_idx 
  on public.talent_portfolio_snapshots(user_id);
create index if not exists talent_portfolio_snapshots_business_idx 
  on public.talent_portfolio_snapshots(business_id);
create index if not exists talent_portfolio_snapshots_template_idx 
  on public.talent_portfolio_snapshots(template_id);

-- ============================================
-- RLS POLICIES - SHARE CONFIG
-- ============================================
alter table public.talent_portfolio_share_config enable row level security;

-- Talent can view their own share config
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'talent_portfolio_share_config' 
    and policyname = 'talent_share_config_select_own'
  ) then
    create policy talent_share_config_select_own
      on public.talent_portfolio_share_config
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

-- Talent can insert their own share config
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'talent_portfolio_share_config' 
    and policyname = 'talent_share_config_insert_own'
  ) then
    create policy talent_share_config_insert_own
      on public.talent_portfolio_share_config
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;
end $$;

-- Talent can update their own share config
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'talent_portfolio_share_config' 
    and policyname = 'talent_share_config_update_own'
  ) then
    create policy talent_share_config_update_own
      on public.talent_portfolio_share_config
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;

-- ============================================
-- RLS POLICIES - SNAPSHOTS
-- ============================================
alter table public.talent_portfolio_snapshots enable row level security;

-- Talent can view their own snapshots
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'talent_portfolio_snapshots' 
    and policyname = 'talent_snapshots_select_own'
  ) then
    create policy talent_snapshots_select_own
      on public.talent_portfolio_snapshots
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

-- Talent can create their own snapshots
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'talent_portfolio_snapshots' 
    and policyname = 'talent_snapshots_insert_own'
  ) then
    create policy talent_snapshots_insert_own
      on public.talent_portfolio_snapshots
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;
end $$;

-- Business can view snapshots shared with them
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'talent_portfolio_snapshots' 
    and policyname = 'business_snapshots_select_shared'
  ) then
    create policy business_snapshots_select_shared
      on public.talent_portfolio_snapshots
      for select
      to authenticated
      using (
        business_id is not null
        and exists (
          select 1
          from public.business_profiles bp
          where bp.id = talent_portfolio_snapshots.business_id
            and bp.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- ============================================
-- HELPER FUNCTION: Build Shared Payload
-- ============================================
create or replace function public.build_shared_portfolio_payload(
  _talent_profile_id uuid,
  _template_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  _share_config public.talent_portfolio_share_config;
  _portfolio_data jsonb;
  _shared_sections jsonb := '{}'::jsonb;
  _shared_media jsonb := '{}'::jsonb;
begin
  -- Get share configuration
  select * into _share_config
  from public.talent_portfolio_share_config
  where talent_profile_id = _talent_profile_id
  limit 1;

  -- If no share config, return empty payload
  if _share_config is null then
    return jsonb_build_object(
      'template_id', _template_id,
      'sections', '{}'::jsonb,
      'media', '{}'::jsonb,
      'snapshot_timestamp', now(),
      'version', 1
    );
  end if;

  -- Get full portfolio data from talent_bank_items
  -- This is a simplified version - you'll need to adapt based on your actual schema
  select jsonb_build_object(
    'skills', coalesce(
      (select jsonb_agg(jsonb_build_object('name', title))
       from public.talent_bank_items
       where user_id = (select user_id from public.talent_profiles where id = _talent_profile_id)
         and item_type = 'skill'
         and is_active = true),
      '[]'::jsonb
    ),
    'experience', coalesce(
      (select jsonb_agg(metadata)
       from public.talent_bank_items
       where user_id = (select user_id from public.talent_profiles where id = _talent_profile_id)
         and item_type = 'experience'
         and is_active = true),
      '[]'::jsonb
    ),
    'education', coalesce(
      (select jsonb_agg(metadata)
       from public.talent_bank_items
       where user_id = (select user_id from public.talent_profiles where id = _talent_profile_id)
         and item_type = 'education'
         and is_active = true),
      '[]'::jsonb
    ),
    'projects', coalesce(
      (select jsonb_agg(metadata)
       from public.talent_bank_items
       where user_id = (select user_id from public.talent_profiles where id = _talent_profile_id)
         and item_type = 'project'
         and is_active = true),
      '[]'::jsonb
    )
  ) into _portfolio_data;

  -- Build shared sections based on toggles
  if _share_config.share_skills then
    _shared_sections := _shared_sections || jsonb_build_object('skills', _portfolio_data->'skills');
  end if;

  if _share_config.share_experience then
    _shared_sections := _shared_sections || jsonb_build_object('experience', _portfolio_data->'experience');
  end if;

  if _share_config.share_education then
    _shared_sections := _shared_sections || jsonb_build_object('education', _portfolio_data->'education');
  end if;

  if _share_config.share_projects then
    _shared_sections := _shared_sections || jsonb_build_object('projects', _portfolio_data->'projects');
  end if;

  -- Build shared media
  if _share_config.share_avatar and _share_config.selected_avatar_path is not null then
    _shared_media := _shared_media || jsonb_build_object('avatar_path', _share_config.selected_avatar_path);
  end if;

  if _share_config.share_banner and _share_config.selected_banner_path is not null then
    _shared_media := _shared_media || jsonb_build_object('banner_path', _share_config.selected_banner_path);
  end if;

  if _share_config.share_intro_video and _share_config.selected_intro_video_id is not null then
    _shared_media := _shared_media || jsonb_build_object('intro_video_id', _share_config.selected_intro_video_id);
  end if;

  -- Return complete shared payload
  return jsonb_build_object(
    'template_id', _template_id,
    'sections', _shared_sections,
    'media', _shared_media,
    'snapshot_timestamp', now(),
    'version', 1
  );
end;
$$;

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
create or replace function public.update_talent_portfolio_share_config_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists talent_portfolio_share_config_updated_at on public.talent_portfolio_share_config;

create trigger talent_portfolio_share_config_updated_at
  before update on public.talent_portfolio_share_config
  for each row
  execute function public.update_talent_portfolio_share_config_updated_at();
