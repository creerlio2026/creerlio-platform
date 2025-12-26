-- Creerlio: Enterprise-grade Business Profile Page content (additive)
-- Stores business-editable public profile content for /business/:business_slug

create table if not exists public.business_profile_pages (
  business_id uuid primary key references public.business_profiles(id) on delete cascade,
  slug text unique not null,
  is_published boolean not null default true,

  -- Core brand identity
  name text,
  logo_url text,
  hero_image_url text,
  tagline text,
  mission text,

  -- Value proposition (editable)
  value_prop_headline text,
  value_prop_body text,

  -- JSON payloads for flexible, enterprise content blocks
  impact_stats jsonb not null default '[]'::jsonb,
  culture_values jsonb not null default '[]'::jsonb,
  business_areas jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  programs jsonb not null default '[]'::jsonb,
  social_proof jsonb not null default '[]'::jsonb,

  live_roles_count integer not null default 0,
  talent_community_enabled boolean not null default false,
  portfolio_intake_enabled boolean not null default false,

  acknowledgement_of_country text,
  updated_at timestamptz not null default now()
);

create index if not exists business_profile_pages_slug_idx on public.business_profile_pages(slug);

alter table public.business_profile_pages enable row level security;

-- Public read: allow anon + authenticated to SELECT published profile pages (safe for /business/:slug)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='business_profile_pages' and policyname='public_read_published'
  ) then
    create policy public_read_published
      on public.business_profile_pages
      for select
      to anon, authenticated
      using (is_published = true);
  end if;
end $$;

-- Business owners can INSERT/UPDATE their own row (ties to business_profiles.user_id = auth.uid())
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='business_profile_pages' and policyname='business_owner_write'
  ) then
    create policy business_owner_write
      on public.business_profile_pages
      for all
      to authenticated
      using (
        exists (
          select 1
          from public.business_profiles bp
          where bp.id = business_profile_pages.business_id
            and bp.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.business_profiles bp
          where bp.id = business_profile_pages.business_id
            and bp.user_id = auth.uid()
        )
      );
  end if;
end $$;


