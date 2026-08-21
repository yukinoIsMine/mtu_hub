import { createClient } from '@/lib/supabase/client'
import { toComment, toPost } from '@/lib/mappers'
import { COMMENT_SELECT, POST_SELECT } from '@/lib/selects'
import type { Comment, Post, PostFlair, VoteState } from '@/lib/types'

/**
 * Writes, issued from the browser so the UI can update optimistically and only
 * reconcile if the server disagrees.
 *
 * Every one of these is gated by RLS: the policies require the row's
 * profile_id / author_id to match the caller's profile, so a forged id fails at
 * the database rather than relying on the client behaving.
 *
 * Each function throws on failure; callers roll their optimistic update back.
 */

/** value 0 removes the vote entirely; 1 and -1 upsert it. */
export async function writePostVote(
  postId: string,
  profileId: string,
  value: VoteState,
): Promise<void> {
  const supabase = createClient()

  if (value === 0) {
    const { error } = await supabase
      .from('post_votes')
      .delete()
      .eq('post_id', postId)
      .eq('profile_id', profileId)

    if (error) throw new Error(error.message)
    return
  }

  const { error } = await supabase
    .from('post_votes')
    .upsert(
      { post_id: postId, profile_id: profileId, value },
      { onConflict: 'post_id,profile_id' },
    )

  if (error) throw new Error(error.message)
}

export async function writeCommentVote(
  commentId: string,
  profileId: string,
  value: VoteState,
): Promise<void> {
  const supabase = createClient()

  if (value === 0) {
    const { error } = await supabase
      .from('comment_votes')
      .delete()
      .eq('comment_id', commentId)
      .eq('profile_id', profileId)

    if (error) throw new Error(error.message)
    return
  }

  const { error } = await supabase
    .from('comment_votes')
    .upsert(
      { comment_id: commentId, profile_id: profileId, value },
      { onConflict: 'comment_id,profile_id' },
    )

  if (error) throw new Error(error.message)
}

export async function writeSubscription(
  communityId: string,
  profileId: string,
  subscribed: boolean,
): Promise<void> {
  const supabase = createClient()

  if (!subscribed) {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('community_id', communityId)
      .eq('profile_id', profileId)

    if (error) throw new Error(error.message)
    return
  }

  // ignoreDuplicates emits ON CONFLICT DO NOTHING, which needs no UPDATE
  // privilege — subscriptions has none, and a repeat join is a no-op anyway.
  const { error } = await supabase
    .from('subscriptions')
    .upsert(
      { community_id: communityId, profile_id: profileId },
      { onConflict: 'profile_id,community_id', ignoreDuplicates: true },
    )

  if (error) throw new Error(error.message)
}

export async function writePost(input: {
  communityId: string
  authorId: string
  title: string
  body: string
  flair: PostFlair | null
}): Promise<Post> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('posts')
    .insert({
      community_id: input.communityId,
      author_id: input.authorId,
      title: input.title,
      body: input.body,
      flair: input.flair,
    })
    .select(POST_SELECT)
    .single()

  if (error) throw new Error(error.message)

  return toPost(data)
}

export async function writeComment(input: {
  postId: string
  parentId: string | null
  authorId: string
  body: string
}): Promise<Comment> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: input.postId,
      parent_id: input.parentId,
      author_id: input.authorId,
      body: input.body,
    })
    .select(COMMENT_SELECT)
    .single()

  if (error) throw new Error(error.message)

  return toComment(data)
}
