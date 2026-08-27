'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Sparkles, TriangleAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PostSummaryPayload } from '@/lib/ai/types'
import type { Comment, Post } from '@/lib/types'

interface AiSummaryCardProps {
  post: Post
  comments: Comment[]
  /** Server-loaded cache so re-entry and commenting do not regenerate. */
  initialSummary?: PostSummaryPayload | null
}

export function AiSummaryCard({
  post,
  comments,
  initialSummary = null,
}: AiSummaryCardProps) {
  const [data, setData] = useState<PostSummaryPayload | null>(initialSummary)
  const [loading, setLoading] = useState(!initialSummary)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const commentCount = comments.length

  const load = useCallback(
    async (opts?: { refresh?: boolean; background?: boolean }) => {
      const refresh = opts?.refresh ?? false
      const background = opts?.background ?? false

      if (background) setRefreshing(true)
      else {
        setLoading(true)
        setError(null)
      }

      try {
        const url = refresh
          ? `/api/posts/${post.id}/summary?refresh=1`
          : `/api/posts/${post.id}/summary`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        const payload = (await res.json()) as PostSummaryPayload
        setData(payload)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Request failed')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [post.id],
  )

  // Only when the post changes. Commenting calls router.refresh() with the same
  // post id — keep the existing (server-cached) summary; do not refetch.
  useEffect(() => {
    setData(initialSummary)
    setError(null)

    if (initialSummary) {
      setLoading(false)
      return
    }

    void load()
    // initialSummary / load intentionally omitted: comment refreshes must not
    // re-seed or re-fetch the summary for this post.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- post.id only
  }, [post.id])

  const byModel = data?.source === 'model' || data?.source === 'cache'
  const canRefresh = Boolean(data) && !loading

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="size-3.5" />
        </span>
        <h3 className="font-heading text-sm font-semibold text-foreground">
          {/* Never claim AI for a summary no model produced. */}
          {loading ? 'Summarizing…' : byModel ? 'AI Topic Summary' : 'Thread Summary'}
        </h3>
        {data && (
          <Badge variant="secondary" className="ml-auto">
            {data.summary.sentiment}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="space-y-2" aria-live="polite" aria-busy="true">
          <div className="h-3 w-11/12 animate-pulse rounded bg-primary/15" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-primary/15" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-primary/15" />
          <p className="pt-1 text-xs text-muted-foreground">
            Reading this thread and {commentCount} comment
            {commentCount === 1 ? '' : 's'}…
          </p>
        </div>
      ) : error && !data ? (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          Could not build a summary for this thread. {error}
        </p>
      ) : data ? (
        <div className="space-y-3 text-sm">
          <p className="leading-relaxed text-foreground">{data.summary.tldr}</p>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Key points
            </p>
            <ul className="space-y-1.5">
              {data.summary.keyPoints.map((point, i) => (
                <li key={i} className="flex gap-2 leading-relaxed">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-foreground/90">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-background/70 p-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Consensus
            </p>
            <p className="mt-1 leading-relaxed text-foreground/90">
              {data.summary.consensus}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[0.7rem] text-muted-foreground">
              {byModel
                ? `Generated by ${data.model} · may not be perfect`
                : 'Rule-based summary — sign in to generate an AI summary'}
            </p>
            {canRefresh ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={refreshing}
                onClick={() => void load({ refresh: true, background: true })}
                className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
              >
                <RefreshCw
                  className={`size-3 ${refreshing ? 'animate-spin' : ''}`}
                />
                {refreshing ? 'Updating…' : 'Refresh'}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
