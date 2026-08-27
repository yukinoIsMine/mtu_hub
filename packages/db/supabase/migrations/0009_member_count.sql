-- 0009 — Live member counts
--
-- communities.member_count was a static seeded number, so joining or leaving
-- changed nothing. It is now maintained by trigger from the subscriptions table.
--
-- Same shape as posts.base_score: the fictional seeded figure moves into
-- base_member_count and real subscriptions accumulate on top, so the demo keeps
-- its plausible numbers instead of every community dropping to zero.

alter table public.communities
  add column if not exists base_member_count integer not null default 0;

update public.communities
   set base_member_count = member_count
 where base_member_count = 0;

create or replace function public.sync_community_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.community_id, old.community_id);
begin
  update public.communities c
     set member_count = c.base_member_count + (
           select count(*)
             from public.subscriptions
            where community_id = target
         )
   where c.id = target;

  return null;
end;
$$;

drop trigger if exists subscriptions_sync_member_count on public.subscriptions;

create trigger subscriptions_sync_member_count
  after insert or delete on public.subscriptions
  for each row execute function public.sync_community_member_count();

-- No grant for member_count or base_member_count: 0008 gives clients no update
-- privilege on communities at all, so only this trigger can change them.
