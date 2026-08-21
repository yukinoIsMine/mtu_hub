-- 0003 — Posts and comments
--
-- score / comment_count / hot_rank are denormalised and maintained by the
-- triggers in 0004. They are stored rather than computed because every feed
-- query sorts by them, and an ORDER BY over an aggregate join cannot use an
-- index.

create table public.posts (
  id            uuid primary key default gen_random_uuid(),
  community_id  uuid not null references public.communities (id) on delete cascade,
  author_id     uuid references public.profiles (id) on delete set null,
  title         text not null check (char_length(title) between 1 and 140),
  body          text not null default '',
  flair         public.post_flair,

  -- Imported/demo score that real votes accumulate on top of. Without this the
  -- first genuine vote would recompute score purely from post_votes and reset
  -- every seeded number to 1.
  base_score    integer not null default 0,
  score         integer not null default 0,

  comment_count integer not null default 0 check (comment_count >= 0),
  hot_rank      double precision not null default 0,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- to_tsvector with an explicit config is immutable, so unlike hot_rank this
  -- one can be a real generated column.
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) stored
);

-- The three feed sorts. Partial indexes because every feed query filters out
-- soft-deleted rows, which keeps the index small and usable for the sort.
create index posts_hot_idx  on public.posts (hot_rank   desc) where deleted_at is null;
create index posts_new_idx  on public.posts (created_at desc) where deleted_at is null;
create index posts_top_idx  on public.posts (score      desc) where deleted_at is null;

create index posts_community_hot_idx
  on public.posts (community_id, hot_rank desc) where deleted_at is null;

create index posts_search_idx on public.posts using gin (search_vector);
create index posts_author_idx on public.posts (author_id);

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  parent_id  uuid,
  author_id  uuid references public.profiles (id) on delete set null,
  body       text not null check (char_length(body) between 1 and 10000),
  base_score integer not null default 0,
  score      integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),

  -- A reply must live on the same post as its parent. Enforced declaratively
  -- via the composite key below rather than in application code.
  unique (id, post_id),
  foreign key (parent_id, post_id)
    references public.comments (id, post_id) on delete cascade
);

create index comments_post_idx   on public.comments (post_id, created_at);
create index comments_parent_idx on public.comments (parent_id);
create index comments_author_idx on public.comments (author_id);
