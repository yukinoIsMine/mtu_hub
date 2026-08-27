-- 0017 — Forum admins (community_moderators + invites + powers).
--
-- Forum admins are rows in community_moderators. The community creator is
-- recorded on communities.created_by and cannot be demoted. Additional admins
-- join via forum_admin_invites (accept RPC). Platform admins still assign
-- directly via the service role.

-- --------------------------------------------------------------- schema ----

alter table public.communities
  add column if not exists created_by uuid references public.profiles (id) on delete set null;

comment on column public.communities.created_by is
  'Profile that created the forum. Cannot be removed as a forum admin.';

create index if not exists communities_created_by_idx
  on public.communities (created_by)
  where created_by is not null;

-- Best-effort backfill: earliest moderator for each community.
update public.communities c
   set created_by = sub.profile_id
  from (
    select distinct on (community_id)
           community_id,
           profile_id
      from public.community_moderators
     order by community_id, added_at asc
  ) sub
 where c.id = sub.community_id
   and c.created_by is null;

create type public.forum_admin_invite_status as enum (
  'pending',
  'accepted',
  'declined',
  'cancelled'
);

create table public.forum_admin_invites (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  invitee_id   uuid not null references public.profiles (id) on delete cascade,
  invited_by   uuid not null references public.profiles (id) on delete cascade,
  status       public.forum_admin_invite_status not null default 'pending',
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

create unique index forum_admin_invites_pending_uniq
  on public.forum_admin_invites (community_id, invitee_id)
  where status = 'pending';

create index forum_admin_invites_invitee_idx
  on public.forum_admin_invites (invitee_id, status);

create index forum_admin_invites_community_idx
  on public.forum_admin_invites (community_id, status);

-- -------------------------------------------------------------- helpers ----

create or replace function public.is_forum_admin(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.community_moderators m
     where m.community_id = cid
       and m.profile_id = public.current_profile_id()
  );
$$;

revoke all on function public.is_forum_admin(uuid) from public;
grant execute on function public.is_forum_admin(uuid) to authenticated, anon;

-- Atomically accept a pending invite and become a forum admin.
create or replace function public.accept_forum_admin_invite(invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.forum_admin_invites%rowtype;
  me  uuid := public.current_profile_id();
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv
    from public.forum_admin_invites
   where id = invite_id
   for update;

  if not found then
    raise exception 'Invite not found';
  end if;

  if inv.invitee_id <> me then
    raise exception 'Not your invite';
  end if;

  if inv.status <> 'pending' then
    raise exception 'Invite is not pending';
  end if;

  if exists (
    select 1
      from public.community_moderators m
     where m.community_id = inv.community_id
       and m.profile_id = me
  ) then
    update public.forum_admin_invites
       set status = 'accepted',
           resolved_at = now()
     where id = invite_id;
    return;
  end if;

  insert into public.community_moderators (community_id, profile_id)
  values (inv.community_id, me);

  update public.forum_admin_invites
     set status = 'accepted',
         resolved_at = now()
   where id = invite_id;
end;
$$;

revoke all on function public.accept_forum_admin_invite(uuid) from public;
grant execute on function public.accept_forum_admin_invite(uuid) to authenticated;

-- Decline a pending invite (invitee only).
create or replace function public.decline_forum_admin_invite(invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.forum_admin_invites%rowtype;
  me  uuid := public.current_profile_id();
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv
    from public.forum_admin_invites
   where id = invite_id
   for update;

  if not found then
    raise exception 'Invite not found';
  end if;

  if inv.invitee_id <> me then
    raise exception 'Not your invite';
  end if;

  if inv.status <> 'pending' then
    raise exception 'Invite is not pending';
  end if;

  update public.forum_admin_invites
     set status = 'declined',
         resolved_at = now()
   where id = invite_id;
end;
$$;

revoke all on function public.decline_forum_admin_invite(uuid) from public;
grant execute on function public.decline_forum_admin_invite(uuid) to authenticated;

-- --------------------------------------------------------------- grants ----

grant insert (slug, name, description, accent, tags, created_by)
  on public.communities to authenticated;

grant update (name, description, accent, tags)
  on public.communities to authenticated;

grant update (position, body)
  on public.community_rules to authenticated;

grant delete on public.community_rules to authenticated;

grant delete on public.community_moderators to authenticated;

grant select on public.forum_admin_invites to authenticated;

grant insert (community_id, invitee_id, invited_by, status)
  on public.forum_admin_invites to authenticated;

grant update (status, resolved_at)
  on public.forum_admin_invites to authenticated;

-- ----------------------------------------------------------------- RLS -----

alter table public.forum_admin_invites enable row level security;

-- Communities: forum admins may edit metadata.
create policy "forum admins update communities"
  on public.communities for update
  to authenticated
  using (public.is_forum_admin(id))
  with check (public.is_forum_admin(id));

-- Rules: forum admins may update/delete.
create policy "forum admins update rules"
  on public.community_rules for update
  to authenticated
  using (public.is_forum_admin(community_id))
  with check (public.is_forum_admin(community_id));

create policy "forum admins delete rules"
  on public.community_rules for delete
  to authenticated
  using (public.is_forum_admin(community_id));

-- Forum admins may remove other forum admins, but never the creator.
create policy "forum admins remove forum admins"
  on public.community_moderators for delete
  to authenticated
  using (
    public.is_forum_admin(community_id)
    and profile_id is distinct from (
      select c.created_by
        from public.communities c
       where c.id = community_moderators.community_id
    )
  );

-- Invites: forum admins create; invitee + forum admins can read.
create policy "forum admins create invites"
  on public.forum_admin_invites for insert
  to authenticated
  with check (
    public.is_forum_admin(community_id)
    and invited_by = public.current_profile_id()
    and invitee_id is distinct from public.current_profile_id()
    and status = 'pending'
    and not exists (
      select 1
        from public.community_moderators m
       where m.community_id = forum_admin_invites.community_id
         and m.profile_id = forum_admin_invites.invitee_id
    )
  );

create policy "invitees and forum admins read invites"
  on public.forum_admin_invites for select
  to authenticated
  using (
    invitee_id = public.current_profile_id()
    or public.is_forum_admin(community_id)
  );

-- Forum admins may cancel pending invites.
create policy "forum admins cancel invites"
  on public.forum_admin_invites for update
  to authenticated
  using (
    public.is_forum_admin(community_id)
    and status = 'pending'
  )
  with check (
    public.is_forum_admin(community_id)
    and status = 'cancelled'
  );

-- Soft-delete posts in communities you administer.
create policy "forum admins soft-delete posts"
  on public.posts for update
  to authenticated
  using (public.is_forum_admin(community_id))
  with check (public.is_forum_admin(community_id));

-- Soft-delete comments on posts in communities you administer.
create policy "forum admins soft-delete comments"
  on public.comments for update
  to authenticated
  using (
    exists (
      select 1
        from public.posts p
       where p.id = comments.post_id
         and public.is_forum_admin(p.community_id)
    )
  )
  with check (
    exists (
      select 1
        from public.posts p
       where p.id = comments.post_id
         and public.is_forum_admin(p.community_id)
    )
  );

-- Member roster + kick.
create policy "forum admins read community subscriptions"
  on public.subscriptions for select
  to authenticated
  using (public.is_forum_admin(community_id));

create policy "forum admins kick members"
  on public.subscriptions for delete
  to authenticated
  using (
    public.is_forum_admin(community_id)
    and profile_id is distinct from (
      select c.created_by
        from public.communities c
       where c.id = subscriptions.community_id
    )
  );
