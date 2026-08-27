-- 0022 — Fix soft-delete of posts under RLS.
--
-- Updating deleted_at can fail with:
--   new row violates row-level security policy for table "posts"
-- because the live-only SELECT policy interacts poorly with UPDATE … RETURNING
-- / WITH CHECK. Use a security-definer RPC for authorized soft-deletes, and
-- let authors / forum admins still SELECT their soft-deleted rows.

create or replace function public.soft_delete_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.current_profile_id();
  r  public.posts%rowtype;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select * into r
    from public.posts
   where id = p_post_id
   for update;

  if not found then
    raise exception 'Post not found';
  end if;

  if r.deleted_at is not null then
    return;
  end if;

  if r.author_id is distinct from me
     and not public.is_forum_admin(r.community_id) then
    raise exception 'Not allowed to remove this post';
  end if;

  update public.posts
     set deleted_at = now(),
         updated_at = now()
   where id = p_post_id;
end;
$$;

revoke all on function public.soft_delete_post(uuid) from public;
grant execute on function public.soft_delete_post(uuid) to authenticated;

create or replace function public.soft_delete_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.current_profile_id();
  c  public.comments%rowtype;
  v_community_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select * into c
    from public.comments
   where id = p_comment_id
   for update;

  if not found then
    raise exception 'Comment not found';
  end if;

  if c.deleted_at is not null then
    return;
  end if;

  select community_id into v_community_id
    from public.posts
   where id = c.post_id;

  if c.author_id is distinct from me
     and (v_community_id is null or not public.is_forum_admin(v_community_id)) then
    raise exception 'Not allowed to remove this comment';
  end if;

  update public.comments
     set deleted_at = now(),
         body = '[deleted]'
   where id = p_comment_id;
end;
$$;

revoke all on function public.soft_delete_comment(uuid) from public;
grant execute on function public.soft_delete_comment(uuid) to authenticated;

-- Authors and forum admins can still read soft-deleted posts (moderation / own history).
drop policy if exists "authors read own posts" on public.posts;
create policy "authors read own posts"
  on public.posts for select
  using (author_id = public.current_profile_id());

drop policy if exists "forum admins read community posts" on public.posts;
create policy "forum admins read community posts"
  on public.posts for select
  to authenticated
  using (public.is_forum_admin(community_id));
