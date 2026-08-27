import type { CommunityAccent } from './accent'
import type { Comment, Community, Notification, NotificationType, Post } from './types'

/**
 * Row → view model conversions. Kept free of any Supabase client import so both
 * server and browser query modules can use them.
 */

const DELETED_AUTHOR = 'deleted'

/**
 * PostgREST returns a to-one embed as an object (null when the FK is null) and
 * a to-many embed as an array. `undefined` is included so that passing an
 * optional property does not widen T to `T | undefined`.
 */
type Embedded<T> = T | T[] | null | undefined

// The casts are needed because TypeScript cannot narrow `T | T[]` through
// Array.isArray while T is still an unresolved type parameter.
function one<T>(value: Embedded<T>): T | null {
  if (value == null) return null

  return (Array.isArray(value) ? (value[0] ?? null) : value) as T | null
}

function many<T>(value: Embedded<T>): T[] {
  if (value == null) return []

  return (Array.isArray(value) ? value : [value]) as T[]
}

function epoch(iso: string): number {
  return Date.parse(iso)
}

interface CommunityRowish {
  id: string
  slug: string
  name: string
  description: string
  accent: string
  tags: string[]
  member_count: number
  founded_at: string
  created_by?: string | null
  community_rules?: Embedded<{ position: number; body: string }>
  community_moderators?: Embedded<{
    profile_id?: string
    profiles: Embedded<{ username: string }>
  }>
}

export function toCommunity(row: CommunityRowish): Community {
  const rules = many(row.community_rules)
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((r) => r.body)

  const forumAdmins = many(row.community_moderators)
    .map((m) => one(m.profiles)?.username)
    .filter((name): name is string => Boolean(name))

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    accent: row.accent as CommunityAccent,
    tags: row.tags,
    members: row.member_count,
    foundedAt: epoch(row.founded_at),
    forumAdmins,
    createdBy: row.created_by ?? null,
    rules,
  }
}

interface PostRowish {
  id: string
  community_id: string
  title: string
  body: string
  flair: Post['flair']
  image_url?: string | null
  score: number
  comment_count: number
  created_at: string
  author?: Embedded<{ username: string }>
}

export function toPost(row: PostRowish): Post {
  return {
    id: row.id,
    communityId: row.community_id,
    author: one(row.author)?.username ?? DELETED_AUTHOR,
    title: row.title,
    body: row.body,
    flair: row.flair,
    imageUrl: row.image_url ?? null,
    score: row.score,
    commentCount: row.comment_count,
    createdAt: epoch(row.created_at),
  }
}

interface CommentRowish {
  id: string
  post_id: string
  parent_id: string | null
  body: string
  score: number
  created_at: string
  deleted_at?: string | null
  author?: Embedded<{ username: string }>
}

export function toComment(row: CommentRowish): Comment {
  const removed = Boolean(row.deleted_at)

  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id,
    // Soft-deleted comments stay in the tree so replies keep their parent.
    author: removed ? DELETED_AUTHOR : (one(row.author)?.username ?? DELETED_AUTHOR),
    body: removed ? '[deleted]' : row.body,
    score: row.score,
    createdAt: epoch(row.created_at),
  }
}

interface NotificationRowish {
  id: string
  type: NotificationType
  post_id: string | null
  comment_id: string | null
  community_id: string | null
  invite_id: string | null
  read_at: string | null
  created_at: string
  actor?: Embedded<{ username: string }>
  communities?: Embedded<{ slug: string; name: string }>
}

export function toNotification(row: NotificationRowish): Notification {
  const community = one(row.communities)

  return {
    id: row.id,
    type: row.type,
    actorUsername: one(row.actor)?.username ?? null,
    postId: row.post_id,
    commentId: row.comment_id,
    communityId: row.community_id,
    communitySlug: community?.slug ?? null,
    communityName: community?.name ?? null,
    inviteId: row.invite_id,
    readAt: row.read_at ? epoch(row.read_at) : null,
    createdAt: epoch(row.created_at),
  }
}

/** Short copy for the notification list. */
export function notificationMessage(n: Notification): string {
  const actor = n.actorUsername ? `u/${n.actorUsername}` : 'Someone'
  const forum = n.communitySlug
    ? `m/${n.communitySlug}`
    : (n.communityName ?? 'a forum')

  switch (n.type) {
    case 'post_comment':
      return `${actor} commented on your post`
    case 'comment_reply':
      return `${actor} replied to your comment`
    case 'post_upvote':
      return `${actor} upvoted your post`
    case 'comment_upvote':
      return `${actor} upvoted your comment`
    case 'community_post':
      return `${actor} posted in ${forum}`
    case 'forum_admin_invite':
      return `${actor} invited you to be a forum admin of ${forum}`
    case 'forum_admin_invite_accepted':
      return `${actor} accepted your forum admin invite for ${forum}`
    case 'forum_admin_invite_declined':
      return `${actor} declined your forum admin invite for ${forum}`
    case 'forum_admin_removed':
      return `You were removed as a forum admin of ${forum}`
    case 'post_removed':
      return `Your post in ${forum} was removed by a moderator`
    case 'comment_removed':
      return `Your comment in ${forum} was removed by a moderator`
    case 'community_kicked':
      return `You were removed from ${forum}`
    default:
      return 'New notification'
  }
}
