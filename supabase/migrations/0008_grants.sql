-- 0008 — Table and column privileges
--
-- RLS in 0006 controls WHICH ROWS a user may touch. It says nothing about
-- WHICH COLUMNS. Without this file a logged-in user can run
--
--   update posts set score = 999999 where <their own post>;
--
-- and RLS happily allows it, because the row is theirs. Column-level grants are
-- what stop that: score, base_score, hot_rank and comment_count are simply not
-- writable by clients. The counter triggers in 0004 are security definer and
-- owned by postgres, so they still maintain those columns normally.
--
-- Roles are guarded so this file also runs on a plain Postgres (local testing)
-- where Supabase's anon/authenticated roles may not exist.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$$;

-- Start from nothing so this file is the single source of truth.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant execute on function public.current_profile_id() to anon, authenticated;
grant execute on function public.hot_rank(integer, timestamptz) to anon, authenticated;

-- ----------------------------------------------------------- read access ---
-- RLS narrows these further; the grant only opens the door.

grant select on
  public.profiles,
  public.communities,
  public.community_rules,
  public.community_moderators,
  public.posts,
  public.comments,
  public.post_votes,
  public.comment_votes,
  public.subscriptions
to anon, authenticated;

-- ---------------------------------------------------------- write access ---
-- Authenticated only, and only on columns a user legitimately owns.

grant insert (community_id, author_id, title, body, flair)
  on public.posts to authenticated;
grant update (title, body, flair, deleted_at, updated_at)
  on public.posts to authenticated;
grant delete on public.posts to authenticated;

grant insert (post_id, parent_id, author_id, body)
  on public.comments to authenticated;
grant update (body, deleted_at)
  on public.comments to authenticated;
grant delete on public.comments to authenticated;

grant insert (post_id, profile_id, value) on public.post_votes to authenticated;
grant update (value)                      on public.post_votes to authenticated;
grant delete                              on public.post_votes to authenticated;

grant insert (comment_id, profile_id, value) on public.comment_votes to authenticated;
grant update (value)                         on public.comment_votes to authenticated;
grant delete                                 on public.comment_votes to authenticated;

grant insert (profile_id, community_id) on public.subscriptions to authenticated;
grant delete                            on public.subscriptions to authenticated;

grant update (username, display_name, avatar_url, bio)
  on public.profiles to authenticated;
