/**
 * PostgREST select strings, shared by the server, browser and mutation modules
 * so a column added in one place cannot drift out of the others.
 *
 * The `!<constraint>` hints on profiles are required: post_votes and
 * comment_votes also link those tables, so a bare `profiles` embed is ambiguous
 * and PostgREST refuses it.
 */

export const COMMUNITY_SELECT = `
  id, slug, name, description, accent, tags,
  member_count, founded_at, created_by,
  community_rules ( position, body ),
  community_moderators ( profile_id, profiles ( username ) )
`

export const POST_SELECT = `
  id, community_id, title, body, flair, image_url, score, comment_count, created_at,
  author:profiles!posts_author_id_fkey ( username )
`

export const COMMENT_SELECT = `
  id, post_id, parent_id, body, score, created_at, deleted_at,
  author:profiles!comments_author_id_fkey ( username )
`
