-- 0001 — Enums and profiles
--
-- Profiles are NOT keyed by auth.users.id. They have their own primary key and
-- an optional user_id link. This lets the seed data create the eight demo
-- authors without fabricating rows in the auth schema, and it means a profile
-- (and its authorship history) survives account deletion.
--
-- The cost is that RLS cannot use `auth.uid() = author_id` directly, so
-- current_profile_id() below resolves the session's profile once per statement.

-- ---------------------------------------------------------------- enums ----

create type public.post_flair as enum (
  'Discussion',
  'Help',
  'Resource',
  'Project',
  'Event',
  'Guide',
  'Announcement',
  'Challenge',
  'Study Group'
);

-- Semantic colour tokens. The UI maps these to Tailwind classes; the database
-- never stores CSS.
create type public.community_accent as enum (
  'teal',
  'teal_deep',
  'orange',
  'blue',
  'green',
  'navy',
  'emerald',
  'indigo'
);

-- ------------------------------------------------------------- profiles ----

create table public.profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid unique references auth.users (id) on delete set null,
  username     text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text,
  avatar_url   text,
  bio          text,
  created_at   timestamptz not null default now()
);

comment on column public.profiles.user_id is
  'Null for seeded demo accounts; set for real signups. Nulled if the auth user is deleted so posts keep their author.';

create index profiles_user_id_idx on public.profiles (user_id);

-- ------------------------------------------------------------- helpers -----

-- Resolves the current session to a profile id. Marked stable so Postgres
-- evaluates it once per statement rather than once per row in RLS checks.
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where user_id = auth.uid();
$$;

-- ------------------------------------------------ profile on user signup ---

-- Derives a unique username from the email local-part, appending a counter on
-- collision. Runs as security definer because auth.users triggers execute
-- outside the new user's own permissions.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base      text;
  candidate text;
  suffix    integer := 0;
begin
  base := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g'));

  if base is null or length(base) < 3 then
    base := 'mtu_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  base      := left(base, 20);
  candidate := base;

  while exists (select 1 from public.profiles where username = candidate) loop
    suffix    := suffix + 1;
    candidate := left(base, 19 - length(suffix::text)) || '_' || suffix;
  end loop;

  insert into public.profiles (user_id, username, display_name)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data ->> 'display_name', candidate)
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
