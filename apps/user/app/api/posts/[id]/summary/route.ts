import { NextResponse } from 'next/server'

import { generateSummary, heuristicSummary, HEURISTIC_MODEL } from '@/lib/ai'
import type { AiSummary, PostSummaryPayload, SummarySource } from '@/lib/ai/types'
import {
  fetchCachedPostSummary,
  fetchCommunities,
  fetchCurrentProfile,
  fetchPostById,
  fetchPostComments,
} from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'

/**
 * Thread summary, cached in post_summaries.
 *
 *   cached (and not ?refresh=1) → return it (no regenerate on re-entry)
 *   ?refresh=1 + signed in      → regenerate, cache, return
 *   missing + signed in         → generate, cache, return
 *   otherwise                   → rule-based fallback, labelled as such
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

  if (!forceRefresh) {
    const cached = await fetchCachedPostSummary(post.id)
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'private, no-store' },
      })
    }
  }

  const comments = await fetchPostComments(post.id)
  const profile = await fetchCurrentProfile()

  if (!profile) {
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
    const supabase = await createClient()
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
  const payload: PostSummaryPayload = {
    summary,
    source,
    model,
    basedOnCommentCount,
  }
  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
