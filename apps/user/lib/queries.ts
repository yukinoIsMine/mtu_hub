import { createClient } from '@/lib/supabase/server'
import { toComment, toCommunity, toNotification, toPost } from '@/lib/mappers'
import { COMMENT_SELECT, COMMUNITY_SELECT, POST_SELECT } from '@/lib/selects'
import type { AiSummary, PostSummaryPayload } from '@/lib/ai/types'
import type {
  Comment,
  Community,
  CommunityMember,
  ForumAdminInvite,
  ForumAdminInviteRow,
  Notification,
  Post,
  Profile,
  Sort,
  VoteState,
} from '@/lib/types'

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
    .select('id, username, display_name, avatar_url, bio, created_at')
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
    bio: data.bio,
    createdAt: Date.parse(data.created_at),
  }
}

export interface UserState {
  postVotes: Record<string, VoteState>
  commentVotes: Record<string, VoteState>
  subscribedCommunityIds: string[]
  /** Communities where the current user is a forum admin. */
  forumAdminCommunityIds: string[]
  pendingForumAdminInvites: ForumAdminInvite[]
  notifications: Notification[]
}

const EMPTY_USER_STATE: UserState = {
  postVotes: {},
  commentVotes: {},
  subscribedCommunityIds: [],
  forumAdminCommunityIds: [],
  pendingForumAdminInvites: [],
  notifications: [],
}

const NOTIFICATION_SELECT = `
  id, type, post_id, comment_id, community_id, invite_id, read_at, created_at,
  actor:profiles!notifications_actor_id_fkey ( username ),
  communities ( slug, name )
`

/**
 * The signed-in user's existing votes and subscriptions.
 *
 * Without this the UI would start every session with no votes highlighted and
 * nothing subscribed, making a returning user's history look wiped.
 */
export async function fetchUserState(profileId: string | null): Promise<UserState> {
  if (!profileId) return EMPTY_USER_STATE

  const supabase = await createClient()

  const [postVotes, commentVotes, subscriptions, moderation, invites, notifications] =
    await Promise.all([
      supabase.from('post_votes').select('post_id, value').eq('profile_id', profileId),
      supabase
        .from('comment_votes')
        .select('comment_id, value')
        .eq('profile_id', profileId),
      supabase.from('subscriptions').select('community_id').eq('profile_id', profileId),
      supabase
        .from('community_moderators')
        .select('community_id')
        .eq('profile_id', profileId),
      supabase
        .from('forum_admin_invites')
        .select(
          `
          id, community_id, created_at,
          communities ( slug, name ),
          inviter:profiles!forum_admin_invites_invited_by_fkey ( username )
        `,
        )
        .eq('invitee_id', profileId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('notifications')
        .select(NOTIFICATION_SELECT)
        .eq('recipient_id', profileId)
        .order('created_at', { ascending: false })
        .limit(40),
    ])

  const pendingForumAdminInvites: ForumAdminInvite[] = (invites.data ?? []).map(
    (row) => {
      const community = Array.isArray(row.communities)
        ? row.communities[0]
        : row.communities
      const inviter = Array.isArray(row.inviter) ? row.inviter[0] : row.inviter

      return {
        id: row.id,
        communityId: row.community_id,
        communitySlug: community?.slug ?? '',
        communityName: community?.name ?? 'Forum',
        invitedByUsername: inviter?.username ?? 'unknown',
        createdAt: Date.parse(row.created_at),
      }
    },
  )

  return {
    postVotes: Object.fromEntries(
      (postVotes.data ?? []).map((v) => [v.post_id, v.value as VoteState]),
    ),
    commentVotes: Object.fromEntries(
      (commentVotes.data ?? []).map((v) => [v.comment_id, v.value as VoteState]),
    ),
    subscribedCommunityIds: (subscriptions.data ?? []).map((s) => s.community_id),
    forumAdminCommunityIds: (moderation.data ?? []).map((m) => m.community_id),
    pendingForumAdminInvites,
    notifications: (notifications.data ?? []).map(toNotification),
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

/** Exact username match; usernames are stored lowercase. Disabled accounts are hidden. */
export async function fetchProfileByUsername(
  username: string,
): Promise<Profile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, created_at')
    .eq('username', username.trim().toLowerCase())
    .is('disabled_at', null)
    .maybeSingle()

  if (error || !data) return null

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    createdAt: Date.parse(data.created_at),
  }
}

export interface FeedOptions {
  /** Restrict to one community (community page). */
  communityId?: string
  /** Restrict to a set of communities (home feed = your subscriptions). */
  communityIds?: string[]
  /** Restrict to posts by one author (profile page). */
  authorId?: string
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

  if (options.authorId) {
    query = query.eq('author_id', options.authorId)
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

  switch (options.sort ?? 'new') {
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

/** Members of a community (forum-admin only via RLS). */
export async function fetchCommunityMembers(
  communityId: string,
): Promise<CommunityMember[]> {
  const supabase = await createClient()

  const [{ data: subs, error }, { data: mods }, { data: community }] =
    await Promise.all([
      supabase
        .from('subscriptions')
        .select(
          `
          profile_id, created_at,
          profiles ( id, username, display_name )
        `,
        )
        .eq('community_id', communityId)
        .order('created_at', { ascending: true }),
      supabase
        .from('community_moderators')
        .select('profile_id')
        .eq('community_id', communityId),
      supabase
        .from('communities')
        .select('created_by')
        .eq('id', communityId)
        .maybeSingle(),
    ])

  if (error) throw new Error(`Failed to load members: ${error.message}`)

  const adminIds = new Set((mods ?? []).map((m) => m.profile_id))
  const createdBy = community?.created_by ?? null

  return (subs ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles

    return {
      profileId: row.profile_id,
      username: profile?.username ?? 'unknown',
      displayName: profile?.display_name ?? null,
      joinedAt: Date.parse(row.created_at),
      isForumAdmin: adminIds.has(row.profile_id),
      isCreator: createdBy != null && row.profile_id === createdBy,
    }
  })
}

/** Pending + recent invites for a community (forum-admin only). */
export async function fetchCommunityAdminInvites(
  communityId: string,
): Promise<ForumAdminInviteRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('forum_admin_invites')
    .select(
      `
      id, community_id, invitee_id, status, created_at,
      invitee:profiles!forum_admin_invites_invitee_id_fkey ( username ),
      inviter:profiles!forum_admin_invites_invited_by_fkey ( username )
    `,
    )
    .eq('community_id', communityId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to load invites: ${error.message}`)

  return (data ?? []).map((row) => {
    const invitee = Array.isArray(row.invitee) ? row.invitee[0] : row.invitee
    const inviter = Array.isArray(row.inviter) ? row.inviter[0] : row.inviter

    return {
      id: row.id,
      communityId: row.community_id,
      inviteeId: row.invitee_id,
      inviteeUsername: invitee?.username ?? 'unknown',
      invitedByUsername: inviter?.username ?? 'unknown',
      status: row.status,
      createdAt: Date.parse(row.created_at),
    }
  })
}

export async function fetchForumAdminProfileIds(
  communityId: string,
): Promise<{ profileId: string; username: string }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('community_moderators')
    .select('profile_id, profiles ( username )')
    .eq('community_id', communityId)

  if (error) throw new Error(`Failed to load forum admins: ${error.message}`)

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      profileId: row.profile_id,
      username: profile?.username ?? 'unknown',
    }
  })
}

/** Cached AI summary for a post, or null if none has been generated yet. */
export async function fetchCachedPostSummary(
  postId: string,
): Promise<PostSummaryPayload | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('post_summaries')
    .select('comment_count, tldr, key_points, consensus, sentiment, model')
    .eq('post_id', postId)
    .maybeSingle()

  if (error) throw new Error(`Failed to load post summary: ${error.message}`)
  if (!data) return null

  return {
    summary: {
      tldr: data.tldr,
      keyPoints: data.key_points,
      consensus: data.consensus,
      sentiment: data.sentiment as AiSummary['sentiment'],
    },
    source: 'cache',
    model: data.model,
    basedOnCommentCount: data.comment_count,
  }
}
