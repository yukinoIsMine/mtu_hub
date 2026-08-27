import { NextResponse } from 'next/server'

import { generateSummary, heuristicSummary, HEURISTIC_MODEL } from '@/lib/ai'
import type { AiSummary, SummarySource } from '@/lib/ai/types'
import {
  fetchCommunities,
  fetchCurrentProfile,
  fetchPostById,
  fetchPostComments,
} from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'

/**
 * Thread summary, cached in post_summaries.
 *
 *   cached (and not ?refresh=1) → return it, even if comment count grew
 *   ?refresh=1 + signed in      → regenerate, cache, return
 *   missing + signed in         → generate, cache, return
 *   otherwise                   → rule-based fallback, labelled as such
 *
 * Automatic refreshes on every new comment were expensive and flashed the UI;
 * clients load once and only force a refresh when the user asks.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const forceRefresh = new URL(request.url).searchParams.get('refresh') === '1'

  const post = await fetchPostById(id)
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const supabase = await createClient()

  const { data: cached } = await supabase
    .from('post_summaries')
    .select('comment_count, tldr, key_points, consensus, sentiment, model')
    .eq('post_id', post.id)
    .maybeSingle()

  if (cached && !forceRefresh) {
    return respond(
      {
        tldr: cached.tldr,
        keyPoints: cached.key_points,
        consensus: cached.consensus,
        sentiment: cached.sentiment as AiSummary['sentiment'],
      },
      'cache',
      cached.model,
      cached.comment_count,
    )
  }

  const comments = await fetchPostComments(post.id)
  const profile = await fetchCurrentProfile()

  if (!profile) {
    // Not signed in: never spend quota, and say plainly what produced this.
    return respond(
      heuristicSummary({ post, comments }),
      'heuristic',
      HEURISTIC_MODEL,
      comments.length,
    )
  }

  const communities = await fetchCommunities()
  const communitySlug = communities.find((c) => c.id === post.communityId)?.slug

  const { summary, source, model } = await generateSummary({
    post,
    comments,
    communitySlug,
  })

  if (source === 'model') {
    const { error } = await supabase.from('post_summaries').upsert(
      {
        post_id: post.id,
        comment_count: post.commentCount,
        tldr: summary.tldr,
        key_points: summary.keyPoints,
        consensus: summary.consensus,
        sentiment: summary.sentiment,
        model,
      },
      { onConflict: 'post_id' },
    )

    // A cache write failure is not worth failing the request over — the reader
    // still gets their summary, it just costs quota again next time.
    if (error) console.error('[ai] failed to cache summary:', error.message)
  }

  return respond(summary, source, model, post.commentCount)
}

function respond(
  summary: AiSummary,
  source: SummarySource,
  model: string,
  basedOnCommentCount: number,
) {
  return NextResponse.json(
    { summary, source, model, basedOnCommentCount },
    // Personalised (depends on session) and already cached in Postgres.
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
