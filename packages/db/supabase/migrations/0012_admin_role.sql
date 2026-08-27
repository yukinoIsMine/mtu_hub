-- Admin role + soft-disable for profiles.
-- Apply after 0001–0011 via SQL Editor.

create type public.profile_role as enum ('user', 'admin');

alter table public.profiles
  add column if not exists role public.profile_role not null default 'user';

alter table public.profiles
  add column if not exists disabled_at timestamptz;

comment on column public.profiles.role is
  'Platform role. Only admins may use the admin dashboard.';

comment on column public.profiles.disabled_at is
  'When set, the account is soft-disabled (cannot participate).';

-- True when the signed-in auth user maps to an admin profile.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
      and p.disabled_at is null
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- Promote a user after they sign up (replace the username):
--   update public.profiles set role = 'admin' where username = 'your_username';
--
-- Or by auth user id:
--   update public.profiles set role = 'admin' where user_id = '<auth-uuid>';
