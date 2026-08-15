'use client'

import { MessageSquare, Share2, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { CommunityAvatar } from '@/components/community-avatar'
import { VoteControl } from '@/components/vote-control'
import { formatCount, timeAgo } from '@/lib/format'
import type { Community, Post, VoteState } from '@/lib/types'

interface PostCardProps {
  post: Post
  community: Community
  vote: VoteState
  onVote: (next: VoteState) => void
  onOpen: () => void
  onOpenCommunity: () => void
}

export function PostCard({
  post,
  community,
  vote,
  onVote,
  onOpen,
  onOpenCommunity,
}: PostCardProps) {
  return (
    <article className="group flex gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40">
      <div className="pt-0.5">
        <VoteControl score={post.score} vote={vote} onVote={onVote} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={onOpenCommunity}
            className="flex items-center gap-1.5 font-medium text-foreground hover:underline"
          >
            <CommunityAvatar community={community} className="size-5 text-[0.65rem]" />
            {community.slug}
          </button>
          <span aria-hidden>·</span>
          <span>
            Posted by {post.author} · {timeAgo(post.createdAt)}
          </span>
          {post.flair && (
            <Badge variant="outline" className="ml-auto">
              {post.flair}
            </Badge>
          )}
        </div>

        <button type="button" onClick={onOpen} className="mt-1.5 block w-full text-left">
          <h2 className="font-heading text-base font-semibold leading-snug text-balance text-foreground group-hover:text-primary">
            {post.title}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {post.body}
          </p>
        </button>

        <div className="mt-2.5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpen}
            className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessageSquare className="size-3.5" />
            {formatCount(post.commentCount)} comments
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <Sparkles className="size-3.5" />
            Summarize with AI
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Share2 className="size-3.5" />
            Share
          </button>
        </div>
      </div>
    </article>
  )
}
