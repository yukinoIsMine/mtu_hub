# Database

Schema for MTU Hub, as ordered SQL migrations. No Supabase CLI required.

## Applying

Open your project → **SQL Editor** → paste each file's contents and run, **in numeric order**.
Order matters: later files reference types, tables and functions created by earlier ones.

| File | What it creates |
|---|---|
| `0001_enums_and_profiles.sql` | `post_flair` / `community_accent` enums, `profiles`, `current_profile_id()`, signup trigger |
| `0002_communities.sql` | `communities`, `community_rules`, `community_moderators` |
| `0003_posts_comments.sql` | `posts`, `comments`, search vector, feed indexes |
| `0004_votes_and_counters.sql` | `post_votes`, `comment_votes`, and the triggers maintaining `score` / `comment_count` / `hot_rank` |
| `0005_subscriptions.sql` | `subscriptions` |
| `0006_rls.sql` | Row Level Security policies |
| `0007_seed.sql` | Demo data from `lib/mock-data.ts` |
| `0008_grants.sql` | Table and **column** privileges |

Every file is safe to re-run except `0001`–`0005`, which use bare `create table`. To start over,
run `drop schema public cascade; create schema public;` first — this destroys all data.

## Things worth knowing

**`0008` is not optional.** RLS decides which *rows* you may write, not which *columns*. Without
the column-level grants in `0008`, any logged-in user can run
`update posts set score = 999999` on their own post and sit at the top of every feed forever.
`score`, `base_score`, `hot_rank` and `comment_count` are not client-writable; only the
`security definer` triggers maintain them.

**Scores are `base_score` + votes.** Seeded posts carry their original score in `base_score`, and
real votes accumulate on top. Without this the first genuine vote would recompute `score` purely
from `post_votes` and reset every demo number to 1.

**`hot_rank` is stored, not computed per query.** Reddit's formula depends only on a row's own
score and creation time — never on `now()` — so it can be indexed. Verified at 50k rows: the Hot,
New and per-community feeds all plan as ordered `Index Scan` with no sort step.

**Seeded authors cannot log in.** The eight demo profiles have `user_id = null`. Real signups get
a profile automatically via the `on_auth_user_created` trigger, which derives a username from the
email local-part and appends a counter on collision (`kyaw_min`, then `kyaw_min_1`).

**Deleting differs by type.** Soft-deleted posts vanish (RLS filters `deleted_at is null`).
Soft-deleted comments stay readable so reply chains keep their middle — so the delete path must
overwrite `body` with a tombstone like `[deleted]`; RLS is not hiding the original text.

## Local verification

The migrations were validated against Postgres 18 with a stub `auth` schema:

```sql
create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
```

Then `set role anon;` / `set role authenticated;` plus
`set request.jwt.claim.sub = '<auth user id>';` exercises the policies without going through the
API.
