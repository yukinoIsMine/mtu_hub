-- 0004 — Votes and the counters they drive
--
-- Two vote tables rather than one polymorphic table with nullable post_id /
-- comment_id: real foreign keys, a primary key that enforces one vote per user
-- per target, and RLS that reads as a single comparison.

create table public.post_votes (
  post_id    uuid not null references public.posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  value      smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create index post_votes_profile_idx on public.post_votes (profile_id);

create table public.comment_votes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  value      smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (comment_id, profile_id)
);

create index comment_votes_profile_idx on public.comment_votes (profile_id);

-- ------------------------------------------------------------ hot rank -----

-- Reddit's hot ranking. It depends only on the row's own score and creation
-- time — never on now() — which is what makes it storable and therefore
-- indexable. The client formula it replaces (score - ageHours * 4) recomputed
-- against the current time on every render and could never use an index.
--
-- 45000 seconds ≈ 12.5 hours: the time gap worth one order of magnitude of score.
create or replace function public.hot_rank(p_score integer, p_created_at timestamptz)
returns double precision
language sql
stable
as $$
  select
    log(greatest(abs(p_score), 1)::numeric)::double precision * sign(p_score)
    + extract(epoch from p_created_at) / 45000.0;
$$;

-- --------------------------------------------------------- post counters ---

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
  select p.base_score + coalesce(v.total, 0)
    into total
    from public.posts p
    left join (
      select post_id, sum(value)::integer as total
        from public.post_votes
       where post_id = target
       group by post_id
    ) v on v.post_id = p.id
   where p.id = target;

  update public.posts
     set score    = total,
         hot_rank = public.hot_rank(total, created_at)
   where id = target;

  return null;
end;
$$;

create trigger post_votes_sync_score
  after insert or update or delete on public.post_votes
  for each row execute function public.sync_post_score();

create or replace function public.sync_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.post_id, old.post_id);
begin
  update public.posts
     set comment_count = (
           select count(*)
             from public.comments
            where post_id = target
              and deleted_at is null
         )
   where id = target;

  return null;
end;
$$;

-- Fires on soft delete too, so [deleted] comments drop out of the count.
create trigger comments_sync_count
  after insert or delete or update of deleted_at, post_id on public.comments
  for each row execute function public.sync_post_comment_count();

-- ------------------------------------------------------ comment counters ---

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
  select c.base_score + coalesce(v.total, 0)
    into total
    from public.comments c
    left join (
      select comment_id, sum(value)::integer as total
        from public.comment_votes
       where comment_id = target
       group by comment_id
    ) v on v.comment_id = c.id
   where c.id = target;

  update public.comments
     set score = total
   where id = target;

  return null;
end;
$$;

create trigger comment_votes_sync_score
  after insert or update or delete on public.comment_votes
  for each row execute function public.sync_comment_score();

-- ----------------------------------------------------- post hot on write ---

-- Keeps hot_rank correct for posts that never receive a vote.
create or replace function public.set_post_hot_rank()
returns trigger
language plpgsql
as $$
begin
  new.hot_rank := public.hot_rank(new.score, new.created_at);
  return new;
end;
$$;

create trigger posts_set_hot_rank
  before insert or update of score, created_at on public.posts
  for each row execute function public.set_post_hot_rank();
