-- 0002 — Communities, their rules and moderators
--
-- Slugs are stored without the `m/` prefix — that is presentation and the UI
-- adds it back. Original casing is kept (EEE, CampusLife) so the sidebar reads
-- exactly as it does today, with a lower() unique index for case-insensitive
-- lookup when we add /m/[slug] routing.

create table public.communities (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null check (slug ~ '^[A-Za-z0-9]{2,32}$'),
  name         text not null,
  description  text not null default '',
  accent       public.community_accent not null default 'teal',
  tags         text[] not null default '{}',
  member_count integer not null default 0 check (member_count >= 0),
  online_count integer not null default 0 check (online_count >= 0),
  founded_at   timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create unique index communities_slug_lower_idx
  on public.communities (lower(slug));

-- Rules are ordered and rendered as a numbered list, so position is part of the
-- data rather than an accident of insertion order.
create table public.community_rules (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  position     smallint not null check (position > 0),
  body         text not null,
  unique (community_id, position)
);

create index community_rules_community_idx
  on public.community_rules (community_id, position);

create table public.community_moderators (
  community_id uuid not null references public.communities (id) on delete cascade,
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  added_at     timestamptz not null default now(),
  primary key (community_id, profile_id)
);

create index community_moderators_profile_idx
  on public.community_moderators (profile_id);
