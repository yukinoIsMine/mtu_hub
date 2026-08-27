-- 0010 — Allow changing an existing vote
--
-- 0008 granted UPDATE only on the `value` column of the vote tables. That looked
-- tight, but it breaks the common case: PostgREST's upsert emits
--
--   insert ... on conflict (post_id, profile_id) do update
--      set post_id = excluded.post_id,
--          profile_id = excluded.profile_id,
--          value = excluded.value
--
-- which touches all three columns and is rejected with
-- "permission denied for table post_votes". The symptom is nasty: casting a
-- first vote works, changing it silently fails.
--
-- Every column on a vote row is user-owned data, so granting UPDATE across all
-- of them gives nothing away. The RLS policies still require
-- profile_id = current_profile_id() in both USING and WITH CHECK, so a vote can
-- never be written on another user's behalf.
--
-- This does NOT relax the grants that matter: posts.score, base_score, hot_rank
-- and comment_count remain unwritable by clients.

grant update (post_id, profile_id, value)
  on public.post_votes to authenticated;

grant update (comment_id, profile_id, value)
  on public.comment_votes to authenticated;
