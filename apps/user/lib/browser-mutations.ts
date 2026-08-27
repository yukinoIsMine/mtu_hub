import { createClient } from '@/lib/supabase/client'
import { toComment, toCommunity, toPost } from '@/lib/mappers'
import { COMMENT_SELECT, COMMUNITY_SELECT, POST_SELECT } from '@/lib/selects'
import type { Comment, Community, Post, PostFlair, VoteState } from '@/lib/types'
import type { CommunityAccent } from '@/lib/accent'

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

export const POST_IMAGE_BUCKET = 'post-images'
export const POST_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const POST_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

function imageExtension(file: File): string {
  switch (file.type) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return 'jpg'
  }
}

export function assertValidPostImage(file: File): void {
  if (!POST_IMAGE_MIME.has(file.type)) {
    throw new Error('Image must be JPEG, PNG, WebP, or GIF.')
  }
  if (file.size > POST_IMAGE_MAX_BYTES) {
    throw new Error('Image must be 5 MB or smaller.')
  }
}

/** Extract `{uid}/{postId}.ext` from a public Storage URL, if present. */
export function postImageObjectPath(imageUrl: string): string | null {
  const marker = `/object/public/${POST_IMAGE_BUCKET}/`
  const idx = imageUrl.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(imageUrl.slice(idx + marker.length).split('?')[0] ?? '')
}

export async function uploadPostImage(postId: string, file: File): Promise<string> {
  assertValidPostImage(file)

  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error('Sign in to upload an image.')

  // Unique path so replaces don't reuse a CDN/browser-cached URL.
  const path = `${user.id}/${postId}-${crypto.randomUUID()}.${imageExtension(file)}`

  const { error: uploadError } = await supabase.storage
    .from(POST_IMAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: '31536000',
    })

  if (uploadError) throw new Error(uploadError.message)

  const { data } = supabase.storage.from(POST_IMAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deletePostImageObject(imageUrl: string): Promise<void> {
  const path = postImageObjectPath(imageUrl)
  if (!path) return

  const supabase = createClient()
  const { error } = await supabase.storage.from(POST_IMAGE_BUCKET).remove([path])
  if (error) throw new Error(error.message)
}

export async function setPostImageUrl(
  postId: string,
  imageUrl: string | null,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('posts')
    .update({
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)

  if (error) throw new Error(error.message)
}

/** Replace or clear the image on an existing post (author only via RLS). */
export async function updatePostImage(
  postId: string,
  file: File | null,
  previousUrl: string | null,
): Promise<string | null> {
  if (file) {
    const url = await uploadPostImage(postId, file)
    await setPostImageUrl(postId, url)
    if (previousUrl) {
      try {
        await deletePostImageObject(previousUrl)
      } catch {
        /* orphaned previous object is acceptable */
      }
    }
    return url
  }

  await setPostImageUrl(postId, null)
  if (previousUrl) {
    try {
      await deletePostImageObject(previousUrl)
    } catch {
      /* DB cleared even if storage delete fails */
    }
  }
  return null
}

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
  image?: File | null
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

  let post = toPost(data)

  if (input.image) {
    try {
      const imageUrl = await uploadPostImage(post.id, input.image)
      await setPostImageUrl(post.id, imageUrl)
      post = { ...post, imageUrl }
    } catch (err) {
      // Post exists without the image; surface the upload failure.
      throw err instanceof Error ? err : new Error('Could not upload image.')
    }
  }

  return post
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

export async function writeCommunity(input: {
  slug: string
  name: string
  description: string
  accent: CommunityAccent
  tags: string[]
  rules: string[]
  creatorProfileId: string
}): Promise<Community> {
  const supabase = createClient()

  const { data: community, error } = await supabase
    .from('communities')
    .insert({
      slug: input.slug,
      name: input.name,
      description: input.description,
      accent: input.accent,
      tags: input.tags,
      created_by: input.creatorProfileId,
    })
    .select(COMMUNITY_SELECT)
    .single()

  if (error) throw new Error(error.message)

  const { error: modError } = await supabase.from('community_moderators').insert({
    community_id: community.id,
    profile_id: input.creatorProfileId,
  })

  if (modError) throw new Error(modError.message)

  if (input.rules.length > 0) {
    const { error: rulesError } = await supabase.from('community_rules').insert(
      input.rules.map((body, i) => ({
        community_id: community.id,
        position: i + 1,
        body,
      })),
    )
    if (rulesError) throw new Error(rulesError.message)
  }

  // Join so member_count reflects the creator immediately.
  await writeSubscription(community.id, input.creatorProfileId, true)

  const { data: refreshed, error: refreshError } = await supabase
    .from('communities')
    .select(COMMUNITY_SELECT)
    .eq('id', community.id)
    .single()

  if (refreshError) throw new Error(refreshError.message)

  return toCommunity(refreshed)
}

export async function updateCommunityMeta(input: {
  communityId: string
  name: string
  description: string
  accent: CommunityAccent
  tags: string[]
}): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('communities')
    .update({
      name: input.name,
      description: input.description,
      accent: input.accent,
      tags: input.tags,
    })
    .eq('id', input.communityId)

  if (error) throw new Error(error.message)
}

export async function replaceCommunityRules(
  communityId: string,
  rules: string[],
): Promise<void> {
  const supabase = createClient()

  const { error: deleteError } = await supabase
    .from('community_rules')
    .delete()
    .eq('community_id', communityId)

  if (deleteError) throw new Error(deleteError.message)

  if (rules.length === 0) return

  const { error } = await supabase.from('community_rules').insert(
    rules.map((body, i) => ({
      community_id: communityId,
      position: i + 1,
      body,
    })),
  )

  if (error) throw new Error(error.message)
}

export async function inviteForumAdmin(input: {
  communityId: string
  inviteeUsername: string
  invitedByProfileId: string
}): Promise<void> {
  const supabase = createClient()
  const username = input.inviteeUsername.trim()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (profileError) throw new Error(profileError.message)
  if (!profile) throw new Error(`No user found with username “${username}”.`)

  const { error } = await supabase.from('forum_admin_invites').insert({
    community_id: input.communityId,
    invitee_id: profile.id,
    invited_by: input.invitedByProfileId,
    status: 'pending',
  })

  if (error) throw new Error(error.message)
}

export async function cancelForumAdminInvite(inviteId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('forum_admin_invites')
    .update({
      status: 'cancelled',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', inviteId)
    .eq('status', 'pending')

  if (error) throw new Error(error.message)
}

export async function acceptForumAdminInvite(inviteId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('accept_forum_admin_invite', {
    invite_id: inviteId,
  })
  if (error) throw new Error(error.message)
}

export async function declineForumAdminInvite(inviteId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('decline_forum_admin_invite', {
    invite_id: inviteId,
  })
  if (error) throw new Error(error.message)
}

export async function removeForumAdmin(input: {
  communityId: string
  profileId: string
}): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('community_moderators')
    .delete()
    .eq('community_id', input.communityId)
    .eq('profile_id', input.profileId)

  if (error) throw new Error(error.message)
}

export async function softDeletePost(postId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.rpc('soft_delete_post', {
    p_post_id: postId,
  })

  if (error) throw new Error(error.message)
}

export async function softDeleteComment(commentId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.rpc('soft_delete_comment', {
    p_comment_id: commentId,
  })

  if (error) throw new Error(error.message)
}

export async function kickCommunityMember(input: {
  communityId: string
  profileId: string
}): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('community_id', input.communityId)
    .eq('profile_id', input.profileId)

  if (error) throw new Error(error.message)
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .is('read_at', null)

  if (error) throw new Error(error.message)
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)

  if (error) throw new Error(error.message)
}
