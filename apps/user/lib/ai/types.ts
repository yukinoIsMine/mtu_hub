import type { Comment, Post } from '@/lib/types'

export const SENTIMENTS = [
  'Positive',
  'Mixed',
  'Constructive',
  'Enthusiastic',
] as const

export type Sentiment = (typeof SENTIMENTS)[number]

export interface AiSummary {
  tldr: string
  keyPoints: string[]
  consensus: string
  sentiment: Sentiment
}

export interface SummaryInput {
  post: Post
  comments: Comment[]
  /** Bare slug, e.g. "EEE". Gives the model the subject context. */
  communitySlug?: string
}

/**
 * Where a summary came from. Surfaced in the UI so the card never claims a model
 * wrote something the rule-based fallback produced.
 */
export type SummarySource = 'cache' | 'model' | 'heuristic'

/** Payload shape shared by the summary API and SSR initial data. */
export interface PostSummaryPayload {
  summary: AiSummary
  source: SummarySource
  model: string
  basedOnCommentCount: number
}

export function isAiSummary(value: unknown): value is AiSummary {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.tldr === 'string' &&
    candidate.tldr.length > 0 &&
    Array.isArray(candidate.keyPoints) &&
    candidate.keyPoints.every((p) => typeof p === 'string') &&
    typeof candidate.consensus === 'string' &&
    SENTIMENTS.includes(candidate.sentiment as Sentiment)
  )
}
