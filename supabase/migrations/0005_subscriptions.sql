-- 0005 — Community subscriptions
--
-- Replaces the `subscribed` Set<string> held in useState in
-- components/forum-app.tsx, which is what the home feed filters on.

create table public.subscriptions (
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  community_id uuid not null references public.communities (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (profile_id, community_id)
);

create index subscriptions_community_idx
  on public.subscriptions (community_id);
