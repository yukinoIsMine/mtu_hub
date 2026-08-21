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
 *   cached and fresh          → return it, nobody pays
 *   stale/missing + signed in → generate, cache, return
 *   otherwise                 → rule-based fallback, labelled as such
 *
 * Anonymous visitors always get something, but only signed-in users can spend
 * model quota.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

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

  if (cached && cached.comment_count === post.commentCount) {
    return respond(
      {
        tldr: cached.tldr,
        keyPoints: cached.key_points,
        consensus: cached.consensus,
        sentiment: cached.sentiment as AiSummary['sentiment'],
      },
      'cache',
      cached.model,
    )
  }

  const comments = await fetchPostComments(post.id)
  const profile = await fetchCurrentProfile()

  if (!profile) {
    // Not signed in: never spend quota, and say plainly what produced this.
    return respond(heuristicSummary({ post, comments }), 'heuristic', HEURISTIC_MODEL)
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

  return respond(summary, source, model)
}

function respond(summary: AiSummary, source: SummarySource, model: string) {
  return NextResponse.json(
    { summary, source, model },
    // Personalised (depends on session) and already cached in Postgres.
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
