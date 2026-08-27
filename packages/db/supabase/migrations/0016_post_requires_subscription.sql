-- 0016 — Users may only create posts in communities they have joined.
--
-- Replaces the open insert policy with one that also requires a subscription.

drop policy if exists "authors create posts" on public.posts;

create policy "authors create posts in joined communities"
  on public.posts for insert
  to authenticated
  with check (
    author_id = public.current_profile_id()
    and exists (
      select 1
        from public.subscriptions s
       where s.community_id = posts.community_id
         and s.profile_id = public.current_profile_id()
    )
  );
