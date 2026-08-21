import Link from 'next/link'
import { Sparkles, TrendingUp } from 'lucide-react'

import { CommunityAvatar } from '@/components/community-avatar'
import { TimeAgo } from '@/components/time-ago'
import { communityLabel, formatCount } from '@/lib/format'
import type { ScoredPost } from '@/lib/recommendations'
import type { Community, Post } from '@/lib/types'

interface RightSidebarProps {
  recommendations: ScoredPost[]
  trending: Post[]
  communities: Community[]
}

export function RightSidebar({
  recommendations,
  trending,
  communities,
}: RightSidebarProps) {
  const communityById = (id: string) => communities.find((c) => c.id === id)
  const top = recommendations.slice(0, 4)

  return (
    <aside className="space-y-4 text-sm">
      <div className="overflow-hidden rounded-xl border border-primary/25 bg-card">
        <div className="flex items-center gap-2 border-b border-border bg-primary/5 px-3 py-2.5">
          <Sparkles className="size-4 text-primary" />
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Recommended for you
          </h2>
        </div>
        <ul className="divide-y divide-border">
          {top.map(({ post, reason }) => {
            const community = communityById(post.communityId)
            if (!community) return null

            return (
              <li key={post.id}>
                <Link
                  href={`/post/${post.id}`}
                  className="flex w-full flex-col gap-1.5 px-3 py-2.5 text-left transition-colors hover:bg-secondary/60"
                >
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CommunityAvatar community={community} className="size-4 text-[0.55rem]" />
                    {communityLabel(community.slug)}
                  </span>
                  <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                    {post.title}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-primary">
                    <Sparkles className="size-3" />
                    {reason}
                  </span>
                </Link>
              </li>
            )
          })}
          {top.length === 0 && (
            <li className="px-3 py-4 text-xs text-muted-foreground">
              Upvote posts and join communities to personalize your feed.
            </li>
          )}
        </ul>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <TrendingUp className="size-4 text-foreground" />
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Trending at MTU
          </h2>
        </div>
        <ol className="divide-y divide-border">
          {trending.map((post, i) => {
            const community = communityById(post.communityId)
            if (!community) return null

            return (
              <li key={post.id}>
                <Link
                  href={`/post/${post.id}`}
                  className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-secondary/60"
                >
                  <span className="font-heading text-base font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                      {post.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {communityLabel(community.slug)} · {formatCount(post.score)} upvotes ·{' '}
                      <TimeAgo at={post.createdAt} />
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          About MTU Hub
        </h2>
        <p className="mt-1.5 leading-relaxed text-muted-foreground">
          The student community forum for Mandalay Technological University.
          Join department communities, ask questions, share resources, and let
          AI summarize long discussions for you.
        </p>
      </div>
    </aside>
  )
}
