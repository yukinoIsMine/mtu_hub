-- 0014 — Real vote scores only (no seeded/fake base_score).
--
-- Zeros base_score on posts and comments, recomputes score from actual votes,
-- refreshes hot_rank, and updates the sync triggers so future votes do not
-- reintroduce a fictional baseline.

update public.posts
   set base_score = 0,
       score = coalesce((
         select sum(v.value)::integer
           from public.post_votes v
          where v.post_id = posts.id
       ), 0);

update public.posts
   set hot_rank = public.hot_rank(score, created_at);

update public.comments
   set base_score = 0,
       score = coalesce((
         select sum(v.value)::integer
           from public.comment_votes v
          where v.comment_id = comments.id
       ), 0);

create or replace function public.sync_post_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.post_id, old.post_id);
  total  integer;
begin
  select coalesce(sum(value), 0)::integer
    into total
    from public.post_votes
   where post_id = target;

  update public.posts
     set score    = total,
         hot_rank = public.hot_rank(total, created_at)
   where id = target;

  return null;
end;
$$;

create or replace function public.sync_comment_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.comment_id, old.comment_id);
  total  integer;
begin
  select coalesce(sum(value), 0)::integer
    into total
    from public.comment_votes
   where comment_id = target;

  update public.comments
     set score = total
   where id = target;

  return null;
end;
$$;
