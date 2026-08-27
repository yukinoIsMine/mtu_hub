-- 0015 — Authenticated users may create forums (communities).
--
-- Insert-only for clients: no update/delete of communities via RLS.
-- Creator must add themselves as moderator before attaching rules.

-- --------------------------------------------------------------- grants ----

grant insert (slug, name, description, accent, tags)
  on public.communities to authenticated;

grant insert (community_id, position, body)
  on public.community_rules to authenticated;

grant insert (community_id, profile_id)
  on public.community_moderators to authenticated;

-- ----------------------------------------------------------------- RLS -----

create policy "authenticated create communities"
  on public.communities for insert
  to authenticated
  with check (public.current_profile_id() is not null);

-- You can only add yourself as a moderator (used right after create).
create policy "users add themselves as moderators"
  on public.community_moderators for insert
  to authenticated
  with check (profile_id = public.current_profile_id());

-- Moderators of a community may add rules.
create policy "moderators add rules"
  on public.community_rules for insert
  to authenticated
  with check (
    exists (
      select 1
        from public.community_moderators m
       where m.community_id = community_rules.community_id
         and m.profile_id = public.current_profile_id()
    )
  );
