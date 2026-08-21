-- 0011 — Cached thread summaries
--
-- One row per post, replaced when the summary is regenerated. `comment_count`
-- records what the summary was generated from: when it no longer matches
-- posts.comment_count the discussion has moved on and the summary is stale.
--
-- This cache is what keeps the app inside a free model tier — re-opening a
-- thread costs nothing.

create table public.post_summaries (
  post_id       uuid primary key references public.posts (id) on delete cascade,
  comment_count integer not null,
  tldr          text not null,
  key_points    text[] not null,
  consensus     text not null,
  sentiment     text not null,
  model         text not null,
  created_at    timestamptz not null default now()
);

alter table public.post_summaries enable row level security;

-- Anyone may read a cached summary...
create policy "summaries are public"
  on public.post_summaries for select using (true);

-- ...but only a signed-in user can spend model quota generating one. This is
-- what stops a public post URL, or a crawler, from draining the daily limit.
create policy "signed-in users generate"
  on public.post_summaries for insert
  with check (auth.uid() is not null);

create policy "signed-in users refresh"
  on public.post_summaries for update
  using      (auth.uid() is not null)
  with check (auth.uid() is not null);

grant select on public.post_summaries to anon, authenticated;
grant insert, update on public.post_summaries to authenticated;
