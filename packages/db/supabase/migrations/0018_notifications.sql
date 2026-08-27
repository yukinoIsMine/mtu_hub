-- 0018 — In-app notifications
--
-- Rows are inserted only by security-definer triggers on social / moderation
-- events. Clients may select, mark read (update read_at), and delete their own
-- notifications — never insert.

-- --------------------------------------------------------------- schema ----

create type public.notification_type as enum (
  'post_comment',
  'comment_reply',
  'post_upvote',
  'comment_upvote',
  'community_post',
  'forum_admin_invite',
  'forum_admin_invite_accepted',
  'forum_admin_invite_declined',
  'forum_admin_removed',
  'post_removed',
  'comment_removed',
  'community_kicked'
);

create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles (id) on delete cascade,
  actor_id      uuid references public.profiles (id) on delete set null,
  type          public.notification_type not null,
  post_id       uuid references public.posts (id) on delete set null,
  comment_id    uuid references public.comments (id) on delete set null,
  community_id  uuid references public.communities (id) on delete set null,
  invite_id     uuid references public.forum_admin_invites (id) on delete set null,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

create index notifications_recipient_unread_idx
  on public.notifications (recipient_id)
  where read_at is null;

-- -------------------------------------------------------------- helpers ----

create or replace function public.insert_notification(
  p_recipient_id uuid,
  p_actor_id     uuid,
  p_type         public.notification_type,
  p_post_id      uuid default null,
  p_comment_id   uuid default null,
  p_community_id uuid default null,
  p_invite_id    uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_recipient_id is null then
    return;
  end if;

  -- Never notify yourself.
  if p_actor_id is not null and p_actor_id = p_recipient_id then
    return;
  end if;

  insert into public.notifications (
    recipient_id, actor_id, type, post_id, comment_id, community_id, invite_id
  ) values (
    p_recipient_id, p_actor_id, p_type, p_post_id, p_comment_id, p_community_id, p_invite_id
  );
end;
$$;

revoke all on function public.insert_notification(
  uuid, uuid, public.notification_type, uuid, uuid, uuid, uuid
) from public;

-- ------------------------------------------------------------- triggers ----

-- Comment on a post, or reply to a comment.
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_author    uuid;
  v_parent_author  uuid;
  v_community_id   uuid;
begin
  select author_id, community_id into v_post_author, v_community_id
    from public.posts
   where id = new.post_id;

  if new.parent_id is null then
    perform public.insert_notification(
      v_post_author,
      new.author_id,
      'post_comment',
      new.post_id,
      new.id,
      v_community_id,
      null
    );
  else
    select author_id into v_parent_author
      from public.comments
     where id = new.parent_id;

    perform public.insert_notification(
      v_parent_author,
      new.author_id,
      'comment_reply',
      new.post_id,
      new.id,
      v_community_id,
      null
    );
  end if;

  return new;
end;
$$;

create trigger comments_notify
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- Upvote on a post (value = 1 only).
create or replace function public.notify_on_post_vote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author       uuid;
  v_community_id uuid;
begin
  if new.value <> 1 then
    return new;
  end if;

  -- Skip updates that were already an upvote.
  if tg_op = 'UPDATE' and old.value = 1 then
    return new;
  end if;

  select author_id, community_id into v_author, v_community_id
    from public.posts
   where id = new.post_id;

  perform public.insert_notification(
    v_author,
    new.profile_id,
    'post_upvote',
    new.post_id,
    null,
    v_community_id,
    null
  );

  return new;
end;
$$;

create trigger post_votes_notify
  after insert or update of value on public.post_votes
  for each row execute function public.notify_on_post_vote();

-- Upvote on a comment (value = 1 only).
create or replace function public.notify_on_comment_vote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author       uuid;
  v_post_id      uuid;
  v_community_id uuid;
begin
  if new.value <> 1 then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.value = 1 then
    return new;
  end if;

  select c.author_id, c.post_id, p.community_id
    into v_author, v_post_id, v_community_id
    from public.comments c
    join public.posts p on p.id = c.post_id
   where c.id = new.comment_id;

  perform public.insert_notification(
    v_author,
    new.profile_id,
    'comment_upvote',
    v_post_id,
    new.comment_id,
    v_community_id,
    null
  );

  return new;
end;
$$;

create trigger comment_votes_notify
  after insert or update of value on public.comment_votes
  for each row execute function public.notify_on_comment_vote();

-- New post in a subscribed community (fan-out to subscribers except author).
create or replace function public.notify_on_community_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    recipient_id, actor_id, type, post_id, community_id
  )
  select
    s.profile_id,
    new.author_id,
    'community_post'::public.notification_type,
    new.id,
    new.community_id
  from public.subscriptions s
  where s.community_id = new.community_id
    and (new.author_id is null or s.profile_id <> new.author_id);

  return new;
end;
$$;

create trigger posts_notify_subscribers
  after insert on public.posts
  for each row execute function public.notify_on_community_post();

-- Forum admin invite created / accepted / declined.
create or replace function public.notify_on_forum_admin_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'pending' then
      perform public.insert_notification(
        new.invitee_id,
        new.invited_by,
        'forum_admin_invite',
        null,
        null,
        new.community_id,
        new.id
      );
    end if;
    return new;
  end if;

  -- UPDATE of status
  if old.status is distinct from new.status then
    if new.status = 'accepted' then
      perform public.insert_notification(
        new.invited_by,
        new.invitee_id,
        'forum_admin_invite_accepted',
        null,
        null,
        new.community_id,
        new.id
      );
    elsif new.status = 'declined' then
      perform public.insert_notification(
        new.invited_by,
        new.invitee_id,
        'forum_admin_invite_declined',
        null,
        null,
        new.community_id,
        new.id
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger forum_admin_invites_notify
  after insert or update of status on public.forum_admin_invites
  for each row execute function public.notify_on_forum_admin_invite();

-- Demoted from forum admin (someone else removed the row).
create or replace function public.notify_on_forum_admin_removed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.current_profile_id();
begin
  -- Self-removal or service-role with no session: still notify when actor ≠ removed.
  if me is not null and me = old.profile_id then
    return old;
  end if;

  perform public.insert_notification(
    old.profile_id,
    me,
    'forum_admin_removed',
    null,
    null,
    old.community_id,
    null
  );

  return old;
end;
$$;

create trigger community_moderators_notify_removed
  after delete on public.community_moderators
  for each row execute function public.notify_on_forum_admin_removed();

-- Post soft-deleted by someone other than the author.
create or replace function public.notify_on_post_removed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.current_profile_id();
begin
  if old.deleted_at is not null or new.deleted_at is null then
    return new;
  end if;

  if me is not null and new.author_id is not null and me = new.author_id then
    return new;
  end if;

  perform public.insert_notification(
    new.author_id,
    me,
    'post_removed',
    new.id,
    null,
    new.community_id,
    null
  );

  return new;
end;
$$;

create trigger posts_notify_removed
  after update of deleted_at on public.posts
  for each row execute function public.notify_on_post_removed();

-- Comment soft-deleted by someone other than the author.
create or replace function public.notify_on_comment_removed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.current_profile_id();
  v_community_id uuid;
begin
  if old.deleted_at is not null or new.deleted_at is null then
    return new;
  end if;

  if me is not null and new.author_id is not null and me = new.author_id then
    return new;
  end if;

  select community_id into v_community_id
    from public.posts
   where id = new.post_id;

  perform public.insert_notification(
    new.author_id,
    me,
    'comment_removed',
    new.post_id,
    new.id,
    v_community_id,
    null
  );

  return new;
end;
$$;

create trigger comments_notify_removed
  after update of deleted_at on public.comments
  for each row execute function public.notify_on_comment_removed();

-- Kicked from a community (subscription deleted by someone else).
create or replace function public.notify_on_community_kicked()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.current_profile_id();
begin
  -- Voluntary leave: the member deletes their own row.
  if me is null or me = old.profile_id then
    return old;
  end if;

  perform public.insert_notification(
    old.profile_id,
    me,
    'community_kicked',
    null,
    null,
    old.community_id,
    null
  );

  return old;
end;
$$;

create trigger subscriptions_notify_kicked
  after delete on public.subscriptions
  for each row execute function public.notify_on_community_kicked();

-- ------------------------------------------------------------------ RLS ----

alter table public.notifications enable row level security;

create policy "own notifications select"
  on public.notifications for select
  using (recipient_id = public.current_profile_id());

create policy "own notifications update"
  on public.notifications for update
  using (recipient_id = public.current_profile_id())
  with check (recipient_id = public.current_profile_id());

create policy "own notifications delete"
  on public.notifications for delete
  using (recipient_id = public.current_profile_id());

-- --------------------------------------------------------------- grants ----

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$$;

grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant delete on public.notifications to authenticated;

-- Backfill pending invites created before this migration.
insert into public.notifications (
  recipient_id, actor_id, type, community_id, invite_id, created_at
)
select
  invitee_id,
  invited_by,
  'forum_admin_invite'::public.notification_type,
  community_id,
  id,
  created_at
from public.forum_admin_invites
where status = 'pending';
