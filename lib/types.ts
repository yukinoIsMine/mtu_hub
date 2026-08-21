import type { CommunityAccent } from './accent'
import type { Database } from './supabase/database.types'

export type VoteState = 1 | 0 | -1

/** Feed ordering. Each value maps to a dedicated index on posts. */
export type Sort = 'hot' | 'new' | 'top'

export const SORTS: Sort[] = ['hot', 'new', 'top']

export function parseSort(value: string | undefined): Sort {
  return SORTS.includes(value as Sort) ? (value as Sort) : 'hot'
}

export type PostFlair = Database['public']['Enums']['post_flair']

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
}

export interface Community {
  id: string
  slug: string
  name: string
  description: string
  accent: CommunityAccent
  tags: string[]
  members: number
  online: number
  foundedAt: number
  moderators: string[]
  rules: string[]
}

export interface Post {
  id: string
  communityId: string
  author: string
  title: string
  body: string
  flair: PostFlair | null
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
