import type { CommunityAccent } from './accent'
import type { Database } from './supabase/database.types'

export type VoteState = 1 | 0 | -1

/** Feed ordering. Each value maps to a dedicated index on posts. */
export type Sort = 'hot' | 'new' | 'top'

/** Default feed sorts lead with Latest, then Top, then Hot. */
export const SORTS: Sort[] = ['new', 'top', 'hot']

export function parseSort(value: string | undefined): Sort {
  return SORTS.includes(value as Sort) ? (value as Sort) : 'new'
}

/** Optional short label on a post (preset suggestions or custom text). */
export type PostFlair = string

/**
 * View models, not database rows.
 *
 * The database uses snake_case and ISO timestamps; the UI uses camelCase and
 * epoch milliseconds. Mapping between them happens once in lib/mappers.ts so a
 * schema change lands in one file rather than across every component.
 *
 * Slugs and usernames are stored bare — `EEE`, `thiha_dev`. Use communityLabel()
 * and userLabel() from lib/format.ts to render the `m/` and `u/` prefixes.
 */

/** The signed-in user's profile row, or null when logged out. */
export interface Profile {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  createdAt: number
}

export interface Community {
  id: string
  slug: string
  name: string
  description: string
  accent: CommunityAccent
  tags: string[]
  members: number
  foundedAt: number
  /** Usernames of forum admins (from community_moderators). */
  forumAdmins: string[]
  /** Profile id of the creator, if known. */
  createdBy: string | null
  rules: string[]
}

export interface ForumAdminInvite {
  id: string
  communityId: string
  communitySlug: string
  communityName: string
  invitedByUsername: string
  createdAt: number
}

export interface CommunityMember {
  profileId: string
  username: string
  displayName: string | null
  joinedAt: number
  isForumAdmin: boolean
  isCreator: boolean
}

export interface ForumAdminInviteRow {
  id: string
  communityId: string
  inviteeId: string
  inviteeUsername: string
  invitedByUsername: string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  createdAt: number
}

export type NotificationType = Database['public']['Enums']['notification_type']

export interface Notification {
  id: string
  type: NotificationType
  actorUsername: string | null
  postId: string | null
  commentId: string | null
  communityId: string | null
  communitySlug: string | null
  communityName: string | null
  inviteId: string | null
  readAt: number | null
  createdAt: number
}

export interface Post {
  id: string
  communityId: string
  author: string
  title: string
  body: string
  flair: PostFlair | null
  imageUrl: string | null
  score: number
  commentCount: number
  createdAt: number
}

export interface Comment {
  id: string
  postId: string
  parentId: string | null
  author: string
  body: string
  score: number
  createdAt: number
}
