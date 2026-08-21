import type { AiSummary, SummaryInput } from './types'
import type { Comment } from '@/lib/types'

/**
 * Rule-based summary. No model involved.
 *
 * This was the original `summarizeTopic` in lib/ai-summary.ts, which the UI
 * presented as AI. It now serves as the fallback for when no API key is
 * configured, the caller is anonymous, or the model call fails — and the card
 * labels it honestly when it is used.
 */

function firstSentences(text: string, count: number): string {
  const parts = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s/)
    .filter(Boolean)

  return parts.slice(0, count).join(' ')
}

function topComments(comments: Comment[], count: number): Comment[] {
  return [...comments].sort((a, b) => b.score - a.score).slice(0, count)
}

export function heuristicSummary({ post, comments }: SummaryInput): AiSummary {
  const relevant = comments.filter((c) => c.postId === post.id)
  const tops = topComments(relevant, 3)

  const tldr = firstSentences(post.body, 2) || post.title

  const keyPoints = [`Original post: ${firstSentences(post.title, 1)}`]
  for (const c of tops) {
    keyPoints.push(`${c.author} (${c.score} pts): ${firstSentences(c.body, 1)}`)
  }

  let sentiment: AiSummary['sentiment']
  const flair = (post.flair ?? '').toLowerCase()

  if (flair.includes('event') || flair.includes('project')) {
    sentiment = 'Enthusiastic'
  } else if (flair.includes('help')) {
    sentiment = 'Constructive'
  } else if (relevant.length > 3) {
    sentiment = 'Mixed'
  } else {
    sentiment = 'Positive'
  }

  const consensus =
    relevant.length === 0
      ? 'No discussion yet — be the first to weigh in.'
      : tops.length > 0
        ? `The thread leans toward ${firstSentences(tops[0].body, 1).toLowerCase()}`
        : 'The community is still forming an opinion on this topic.'

  return { tldr, keyPoints, consensus, sentiment }
}
