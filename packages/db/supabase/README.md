# Database (`@mtu/db`)

Schema for MTU Hub, as ordered SQL migrations. No Supabase CLI required.

## Applying

Open your project → **SQL Editor** → paste each file's contents and run, **in numeric order**.
Order matters: later files reference types, tables and functions created by earlier ones.

| File | What it creates |
|---|---|
| `0001_enums_and_profiles.sql` | `post_flair` (later replaced by text) / `community_accent` enums, `profiles`, `current_profile_id()`, signup trigger |
| `0002_communities.sql` | `communities`, `community_rules`, `community_moderators` |
| `0003_posts_comments.sql` | `posts`, `comments`, search vector, feed indexes |
| `0004_votes_and_counters.sql` | `post_votes`, `comment_votes`, and the triggers maintaining `score` / `comment_count` / `hot_rank` |
| `0005_subscriptions.sql` | `subscriptions` |
| `0006_rls.sql` | Row Level Security policies |
| `0007_seed.sql` | Demo data |
| `0008_grants.sql` | Table and **column** privileges |
| `0009_member_count.sql` | Live `member_count` from subscriptions |
| `0010_vote_grants.sql` | Vote table grants |
| `0011_post_summaries.sql` | AI summary cache |
| `0012_admin_role.sql` | `profiles.role`, `disabled_at`, `is_admin()` |
| `0013_real_member_counts.sql` | Zero fake bases; `member_count` = real subscriptions only |
| `0014_real_vote_scores.sql` | Zero `base_score`; `score` = real votes only |
| `0015_user_create_communities.sql` | Authenticated users can create forums (+ self as mod, rules) |
| `0016_post_requires_subscription.sql` | Posts only allowed in communities the author has joined |
| `0017_forum_admins.sql` | Forum admins: `created_by`, invites, RLS for settings/moderation/members |
| `0018_notifications.sql` | In-app `notifications` table + triggers for social/moderation events |
| `0019_harden_notification_cascades.sql` | Allow community deletes when notification triggers fire mid-cascade |
| `0020_post_images.sql` | Optional `posts.image_url` + public `post-images` Storage bucket |
| `0021_custom_post_flair.sql` | `posts.flair` free text (≤40 chars); drop `post_flair` enum |
| `0022_soft_delete_post_rpc.sql` | `soft_delete_post` / `soft_delete_comment` RPCs + SELECT policies for deleted rows |

### Promote an admin

After a real user signs up on the forum app:

```sql
update public.profiles set role = 'admin' where username = 'your_username';
```

Every file is safe to re-run except `0001`–`0005`, which use bare `create table`. To start over,
run `drop schema public cascade; create schema public;` first — this destroys all data.

## Things worth knowing

**`0008` is not optional.** RLS decides which *rows* you may write, not which *columns*. Without
the column-level grants in `0008`, any logged-in user can run
`update posts set score = 999999` on their own post and sit at the top of every feed forever.

**Admin mutations use the service role** in `apps/admin` (server-only). Community CRUD is not
available to the anon/authenticated clients by design.

**Seeded authors cannot log in.** Demo profiles have `user_id = null`.

**Deleting differs by type.** Soft-deleted posts vanish (RLS filters `deleted_at is null`).
Soft-deleted comments stay readable so reply chains keep their middle.
