-- 0006 — Row Level Security
--
-- Read is public (the forum is world-readable); writes require a session whose
-- profile matches the row's owner. current_profile_id() returns null for
-- anonymous requests, and every ownership comparison against null is null,
-- which fails the policy — so anonymous writes are denied by construction.
--
-- The counter triggers in 0004 are security definer and owned by postgres, so
-- they update posts.score and comments.score without needing a policy of their
-- own. Nothing else may write those columns directly.

-- ------------------------------------------------------------- profiles ----

alter table public.profiles enable row level security;

create policy "profiles are public"
  on public.profiles for select using (true);

create policy "own profile update"
  on public.profiles for update
  using      (id = public.current_profile_id())
  with check (id = public.current_profile_id());

-- ---------------------------------------------------------- communities ----
-- Read-only to clients. Communities, rules and moderators are managed from the
-- dashboard or with the service role key, which bypasses RLS entirely.

alter table public.communities          enable row level security;
alter table public.community_rules      enable row level security;
alter table public.community_moderators enable row level security;

create policy "communities are public"
  on public.communities for select using (true);

create policy "rules are public"
  on public.community_rules for select using (true);

create policy "moderators are public"
  on public.community_moderators for select using (true);

-- ---------------------------------------------------------------- posts ----

alter table public.posts enable row level security;

-- Soft-deleted posts disappear completely rather than becoming tombstones.
create policy "live posts are public"
  on public.posts for select
  using (deleted_at is null);

create policy "authors create posts"
  on public.posts for insert
  with check (author_id = public.current_profile_id());

create policy "authors update own posts"
  on public.posts for update
  using      (author_id = public.current_profile_id())
  with check (author_id = public.current_profile_id());

create policy "authors delete own posts"
  on public.posts for delete
  using (author_id = public.current_profile_id());

-- ------------------------------------------------------------- comments ----

alter table public.comments enable row level security;

-- Unlike posts, soft-deleted comments stay readable so a reply chain does not
-- lose its middle. Deleting must overwrite body with a tombstone such as
-- '[deleted]' — RLS is not hiding the original text here.
create policy "comments are public"
  on public.comments for select using (true);

create policy "authors create comments"
  on public.comments for insert
  with check (author_id = public.current_profile_id());

create policy "authors update own comments"
  on public.comments for update
  using      (author_id = public.current_profile_id())
  with check (author_id = public.current_profile_id());

create policy "authors delete own comments"
  on public.comments for delete
  using (author_id = public.current_profile_id());

-- ---------------------------------------------------------------- votes ----
-- Tallies are public so scores can be recomputed and audited, but a vote may
-- only ever be written on your own behalf.

alter table public.post_votes    enable row level security;
alter table public.comment_votes enable row level security;

create policy "post votes are public"
  on public.post_votes for select using (true);

create policy "own post votes insert"
  on public.post_votes for insert
  with check (profile_id = public.current_profile_id());

create policy "own post votes update"
  on public.post_votes for update
  using      (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

create policy "own post votes delete"
  on public.post_votes for delete
  using (profile_id = public.current_profile_id());

create policy "comment votes are public"
  on public.comment_votes for select using (true);

create policy "own comment votes insert"
  on public.comment_votes for insert
  with check (profile_id = public.current_profile_id());

create policy "own comment votes update"
  on public.comment_votes for update
  using      (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

create policy "own comment votes delete"
  on public.comment_votes for delete
  using (profile_id = public.current_profile_id());

-- -------------------------------------------------------- subscriptions ----
-- Private: who you follow is only visible to you. Public member counts come
-- from communities.member_count instead.

alter table public.subscriptions enable row level security;

create policy "own subscriptions select"
  on public.subscriptions for select
  using (profile_id = public.current_profile_id());

create policy "own subscriptions insert"
  on public.subscriptions for insert
  with check (profile_id = public.current_profile_id());

create policy "own subscriptions delete"
  on public.subscriptions for delete
  using (profile_id = public.current_profile_id());
