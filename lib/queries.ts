import { createClient } from '@/lib/supabase/server'
import { toComment, toCommunity, toPost } from '@/lib/mappers'
import { COMMENT_SELECT, COMMUNITY_SELECT, POST_SELECT } from '@/lib/selects'
import type { Comment, Community, Post, Profile, Sort, VoteState } from '@/lib/types'

/**
 * Server-side reads, used by Server Components. Imports next/headers via the
 * server client, so this module must never be pulled into a Client Component —
 * writes from the browser live in lib/browser-mutations.ts instead.
 */

/**
 * The signed-in user's profile, or null when logged out.
 *
 * Uses getClaims() rather than getSession() — session data from cookies is not
 * trustworthy on the server, whereas getClaims() verifies the token.
 */
export async function fetchCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (!userId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('user_id', userId)
    .maybeSingle()

  // A signed-in user with no profile row means the signup trigger did not fire.
  // Treat as logged out rather than crashing the page.
  if (error || !data) return null

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
  }
}

export interface UserState {
  postVotes: Record<string, VoteState>
  commentVotes: Record<string, VoteState>
  subscribedCommunityIds: string[]
}

const EMPTY_USER_STATE: UserState = {
  postVotes: {},
  commentVotes: {},
  subscribedCommunityIds: [],
}

/**
 * The signed-in user's existing votes and subscriptions.
 *
 * Without this the UI would start every session with no votes highlighted and
 * nothing subscribed, making a returning user's history look wiped.
 */
export async function fetchUserState(profileId: string | null): Promise<UserState> {
  if (!profileId) return EMPTY_USER_STATE

  const supabase = await createClient()

  const [postVotes, commentVotes, subscriptions] = await Promise.all([
    supabase.from('post_votes').select('post_id, value').eq('profile_id', profileId),
    supabase
      .from('comment_votes')
      .select('comment_id, value')
      .eq('profile_id', profileId),
    supabase.from('subscriptions').select('community_id').eq('profile_id', profileId),
  ])

  return {
    postVotes: Object.fromEntries(
      (postVotes.data ?? []).map((v) => [v.post_id, v.value as VoteState]),
    ),
    commentVotes: Object.fromEntries(
      (commentVotes.data ?? []).map((v) => [v.comment_id, v.value as VoteState]),
    ),
    subscribedCommunityIds: (subscriptions.data ?? []).map((s) => s.community_id),
  }
}

export async function fetchCommunities(): Promise<Community[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('communities')
    .select(COMMUNITY_SELECT)
    .order('member_count', { ascending: false })

  if (error) throw new Error(`Failed to load communities: ${error.message}`)

  return (data ?? []).map(toCommunity)
}

/** Slug lookup is case-insensitive, matching the lower(slug) unique index. */
export async function fetchCommunityBySlug(slug: string): Promise<Community | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('communities')
    .select(COMMUNITY_SELECT)
    .ilike('slug', slug)
    .maybeSingle()

  if (error || !data) return null

  return toCommunity(data)
}

export interface FeedOptions {
  /** Restrict to one community (community page). */
  communityId?: string
  /** Restrict to a set of communities (home feed = your subscriptions). */
  communityIds?: string[]
  sort?: Sort
  query?: string
  limit?: number
}

/**
 * The feed query. Sorting and filtering happen in Postgres rather than in the
 * browser, so each sort is served by its matching index:
 *
 *   hot → posts_hot_idx     new → posts_new_idx     top → posts_top_idx
 *
 * and a community page uses posts_community_hot_idx. Search uses the GIN index
 * over search_vector instead of scanning every row's title and body.
 */
export async function fetchPosts(options: FeedOptions = {}): Promise<Post[]> {
  const supabase = await createClient()

  let query = supabase.from('posts').select(POST_SELECT).is('deleted_at', null)

  if (options.communityId) {
    query = query.eq('community_id', options.communityId)
  } else if (options.communityIds && options.communityIds.length > 0) {
    query = query.in('community_id', options.communityIds)
  }

  const search = options.query?.trim()
  if (search) {
    // websearch parses quotes and OR the way a search box user expects, and is
    // parameterised — no filter-string escaping to get wrong.
    query = query.textSearch('search_vector', search, {
      type: 'websearch',
      config: 'english',
    })
  }

  switch (options.sort ?? 'hot') {
    case 'new':
      query = query.order('created_at', { ascending: false })
      break
    case 'top':
      query = query.order('score', { ascending: false })
      break
    default:
      query = query.order('hot_rank', { ascending: false })
  }

  const { data, error } = await query.limit(options.limit ?? 50)

  if (error) throw new Error(`Failed to load posts: ${error.message}`)

  return (data ?? []).map(toPost)
}

export async function fetchPostById(id: string): Promise<Post | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) return null

  return toPost(data)
}

/** Comments for a post, server-rendered so a shared thread link needs no round trip. */
export async function fetchPostComments(postId: string): Promise<Comment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_SELECT)
    .eq('post_id', postId)
    .order('score', { ascending: false })

  if (error) throw new Error(`Failed to load comments: ${error.message}`)

  return (data ?? []).map(toComment)
}
