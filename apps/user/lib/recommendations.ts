import type { Community, Post, VoteState } from './types'

interface RecommendInput {
  posts: Post[]
  communities: Community[]
  votes: Record<string, VoteState>
  subscribed: Set<string>
}

export interface ScoredPost {
  post: Post
  reason: string
  matchScore: number
}

/**
 * A lightweight personalized recommender. It builds an interest profile from
 * the communities you have upvoted in or subscribed to, then ranks posts you
 * have not yet voted on by how well they match that profile plus their
 * popularity and freshness. This mimics a collaborative/content hybrid feed.
 */
export function recommendPosts(input: RecommendInput): ScoredPost[] {
  const { posts, communities, votes, subscribed } = input

  // Build affinity weights per community from behavior.
  const affinity: Record<string, number> = {}
  for (const c of communities) affinity[c.id] = subscribed.has(c.id) ? 2 : 0

  for (const post of posts) {
    const v = votes[post.id]
    if (v === 1) affinity[post.communityId] = (affinity[post.communityId] || 0) + 3
    if (v === -1) affinity[post.communityId] = (affinity[post.communityId] || 0) - 1
  }

  const now = Date.now()
  const scored: ScoredPost[] = posts
    .filter((p) => votes[p.id] !== 1 && votes[p.id] !== -1)
    .map((post) => {
      const community = communities.find((c) => c.id === post.communityId)
      const interest = affinity[post.communityId] || 0
      const ageHours = (now - post.createdAt) / (1000 * 60 * 60)
      const freshness = Math.max(0, 48 - ageHours) / 48
      const popularity = Math.log10(Math.max(10, post.score))

      const matchScore = interest * 4 + popularity * 2 + freshness * 3

      let reason = 'Trending across MTU'
      if (interest >= 4) {
        reason = `Because you're active in ${community?.slug}`
      } else if (interest >= 2) {
        reason = `From ${community?.slug}, a community you follow`
      } else if (freshness > 0.85) {
        reason = 'Fresh and gaining traction'
      } else if (popularity >= 2.5) {
        reason = 'Popular this week'
      }

      return { post, reason, matchScore }
    })
    .sort((a, b) => b.matchScore - a.matchScore)

  return scored
}
