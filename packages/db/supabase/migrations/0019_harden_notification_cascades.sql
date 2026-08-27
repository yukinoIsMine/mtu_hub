-- 0019 — Harden notification triggers so community deletes can cascade.
--
-- notify_on_forum_admin_removed / notify_on_community_kicked insert into
-- notifications with community_id set. During ON DELETE CASCADE of a
-- community those inserts race the parent delete and fail the FK, aborting
-- the whole community delete (admin dashboard "Delete forum").
-- Catch FK violations and retry without community_id.

create or replace function public.notify_on_forum_admin_removed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.current_profile_id();
begin
  -- Self-removal: no notification.
  if me is not null and me = old.profile_id then
    return old;
  end if;

  begin
    perform public.insert_notification(
      old.profile_id,
      me,
      'forum_admin_removed',
      null,
      null,
      old.community_id,
      null
    );
  exception
    when foreign_key_violation then
      perform public.insert_notification(
        old.profile_id,
        me,
        'forum_admin_removed',
        null,
        null,
        null,
        null
      );
  end;

  return old;
end;
$$;

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

  begin
    perform public.insert_notification(
      old.profile_id,
      me,
      'community_kicked',
      null,
      null,
      old.community_id,
      null
    );
  exception
    when foreign_key_violation then
      perform public.insert_notification(
        old.profile_id,
        me,
        'community_kicked',
        null,
        null,
        null,
        null
      );
  end;

  return old;
end;
$$;
