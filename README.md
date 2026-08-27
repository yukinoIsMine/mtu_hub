# MTU Hub

Turborepo monorepo for the Mandalay Technological University student forum.

## Apps

| App | Port | Description |
|-----|------|-------------|
| [`apps/user`](apps/user) | 3000 | Reddit-like forum (communities, posts, comments, votes) |
| [`apps/admin`](apps/admin) | 3001 | Admin dashboard (users, forums, posts) |

## Packages

| Package | Description |
|---------|-------------|
| [`packages/db`](packages/db) | Supabase migrations, typed clients, `Database` types |
| [`packages/ui`](packages/ui) | Shared UI primitives |

## Setup

```bash
pnpm install
```

Copy env files:

```bash
cp .env.example apps/user/.env.local
cp .env.example apps/admin/.env.local
# Fill NEXT_PUBLIC_* in both; GEMINI_API_KEY in user; SUPABASE_SERVICE_ROLE_KEY in admin
```

Apply SQL migrations in order from [`packages/db/supabase/migrations`](packages/db/supabase/migrations) (see that package README). After `0012_admin_role.sql`, promote an admin:

```sql
update public.profiles set role = 'admin' where username = 'your_username';
```

## Develop

```bash
pnpm dev          # both apps via Turbo
pnpm dev:user     # forum only :3000
pnpm dev:admin    # admin only :3001
```
