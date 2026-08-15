export type VoteState = 1 | 0 | -1

export interface Community {
  id: string
  slug: string // e.g. "m/eee"
  name: string // "Electrical Engineering"
  description: string
  members: number
  colorClass: string // tailwind class for the avatar background
  tags: string[]
  online?: number // members active now
  foundedAt?: number // epoch ms the community was created
  moderators?: string[] // usernames of moderators
  rules?: string[] // community rules
}

export interface Comment {
  id: string
  postId: string
  parentId: string | null
  author: string
  body: string
  score: number
  createdAt: number // epoch ms
}

export interface Post {
  id: string
  communityId: string
  author: string
  title: string
  body: string
  flair?: string
  score: number
  commentCount: number
  createdAt: number // epoch ms
}
