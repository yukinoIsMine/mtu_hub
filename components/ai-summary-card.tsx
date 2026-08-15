'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { summarizeTopic } from '@/lib/ai-summary'
import type { Comment, Post } from '@/lib/types'

interface AiSummaryCardProps {
  post: Post
  comments: Comment[]
}

export function AiSummaryCard({ post, comments }: AiSummaryCardProps) {
  const [loading, setLoading] = useState(true)

  // Simulate the latency of an AI request so the summary feels generated.
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 1100)
    return () => clearTimeout(t)
  }, [post.id, comments.length])

  const summary = summarizeTopic(post, comments)

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="size-3.5" />
        </span>
        <h3 className="font-heading text-sm font-semibold text-foreground">
          AI Topic Summary
        </h3>
        {!loading && (
          <Badge variant="secondary" className="ml-auto">
            {summary.sentiment}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="space-y-2" aria-live="polite" aria-busy="true">
          <div className="h-3 w-11/12 animate-pulse rounded bg-primary/15" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-primary/15" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-primary/15" />
          <p className="pt-1 text-xs text-muted-foreground">
            Summarizing this thread and {comments.length} comment
            {comments.length === 1 ? '' : 's'}…
          </p>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="leading-relaxed text-foreground">{summary.tldr}</p>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Key points
            </p>
            <ul className="space-y-1.5">
              {summary.keyPoints.map((point, i) => (
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
              {summary.consensus}
            </p>
          </div>

          <p className="text-[0.7rem] text-muted-foreground">
            AI-generated summary · may not be perfect
          </p>
        </div>
      )}
    </div>
  )
}
