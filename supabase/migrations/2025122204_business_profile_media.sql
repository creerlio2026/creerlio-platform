-- Creerlio: Business Profile Media (images, video, documents) - additive
-- Adds a JSONB media_assets column to business_profile_pages and a Storage bucket with safe owner-only write policies.

-- 1) Add media_assets to business_profile_pages (non-breaking, additive)
alter table if exists public.business_profile_pages
  add column if not exists media_assets jsonb not null default '[]'::jsonb;

-- 2) Storage bucket for public business profile media
-- Note: keeping this bucket public so /business/:slug can render assets without signed URLs.
insert into storage.buckets (id, name, public)
values ('business_profile_media', 'business_profile_media', true)
on conflict (id) do nothing;

-- 3) RLS policies for storage.objects in this bucket
-- Naming convention enforced by policies:
--   business/<business_id>/<filename>
-- Only the owner of business_profiles(id=business_id, user_id=auth.uid()) may upload/update/delete.
do $$
begin
  -- Public read (anon + authenticated)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'public_read_business_profile_media'
  ) then
    create policy public_read_business_profile_media
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'business_profile_media');
  end if;

  -- Owner insert
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'business_owner_insert_business_profile_media'
  ) then
    create policy business_owner_insert_business_profile_media
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'business_profile_media'
        and split_part(name, '/', 1) = 'business'
        and (split_part(name, '/', 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
        and exists (
          select 1
          from public.business_profiles bp
          where bp.id = (split_part(name, '/', 2))::uuid
            and bp.user_id = auth.uid()
        )
      );
  end if;

  -- Owner update
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'business_owner_update_business_profile_media'
  ) then
    create policy business_owner_update_business_profile_media
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'business_profile_media'
        and split_part(name, '/', 1) = 'business'
        and (split_part(name, '/', 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
        and exists (
          select 1
          from public.business_profiles bp
          where bp.id = (split_part(name, '/', 2))::uuid
            and bp.user_id = auth.uid()
        )
      )
      with check (
        bucket_id = 'business_profile_media'
        and split_part(name, '/', 1) = 'business'
        and (split_part(name, '/', 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
        and exists (
          select 1
          from public.business_profiles bp
          where bp.id = (split_part(name, '/', 2))::uuid
            and bp.user_id = auth.uid()
        )
      );
  end if;

  -- Owner delete
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'business_owner_delete_business_profile_media'
  ) then
    create policy business_owner_delete_business_profile_media
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'business_profile_media'
        and split_part(name, '/', 1) = 'business'
        and (split_part(name, '/', 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
        and exists (
          select 1
          from public.business_profiles bp
          where bp.id = (split_part(name, '/', 2))::uuid
            and bp.user_id = auth.uid()
        )
      );
  end if;
end $$;


