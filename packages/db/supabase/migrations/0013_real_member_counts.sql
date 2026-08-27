-- 0013 — Real member counts only (no seeded/fake baselines).
--
-- Clears base_member_count and online_count, then sets member_count to the
-- actual number of rows in subscriptions. The sync trigger no longer adds a
-- fictional base.

update public.communities
   set base_member_count = 0,
       online_count = 0,
       member_count = (
         select count(*)::integer
           from public.subscriptions s
          where s.community_id = communities.id
       );

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
     set member_count = (
           select count(*)::integer
             from public.subscriptions
            where community_id = target
         )
   where c.id = target;

  return null;
end;
$$;
