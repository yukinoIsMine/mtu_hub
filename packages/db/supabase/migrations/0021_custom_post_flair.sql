-- Allow free-text post flair (presets remain UI suggestions only).
-- Existing enum values cast cleanly to text.

alter table public.posts
  alter column flair type text using flair::text;

alter table public.posts
  add constraint posts_flair_length_check
  check (
    flair is null
    or (
      char_length(flair) between 1 and 40
      and flair = btrim(flair)
    )
  );

drop type public.post_flair;
