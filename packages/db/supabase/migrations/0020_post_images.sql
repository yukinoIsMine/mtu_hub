-- 0020 — Optional post images (Supabase Storage)
--
-- One nullable image_url per post. Files live in the public `post-images`
-- bucket under `{auth.uid()}/{post_id}.{ext}`. Clients upload after insert
-- and set image_url; ownership is enforced by the Storage folder name.

alter table public.posts
  add column if not exists image_url text;

comment on column public.posts.image_url is
  'Public URL of an optional image in the post-images Storage bucket.';

-- Column grants (additive to 0008).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$$;

grant insert (image_url) on public.posts to authenticated;
grant update (image_url) on public.posts to authenticated;

-- ------------------------------------------------------------- storage ----

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Drop prior policies if re-running.
drop policy if exists "Public read post images" on storage.objects;
drop policy if exists "Users upload own post images" on storage.objects;
drop policy if exists "Users update own post images" on storage.objects;
drop policy if exists "Users delete own post images" on storage.objects;

create policy "Public read post images"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Users upload own post images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own post images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own post images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
