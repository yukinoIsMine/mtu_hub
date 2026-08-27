'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, MessageSquare, Share2, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { CommunityAvatar } from '@/components/community-avatar'
import { VoteControl } from '@/components/vote-control'
import { useInteractions } from '@/components/interactions-provider'
import { TimeAgo } from '@/components/time-ago'
import { communityLabel, formatCount, userLabel } from '@/lib/format'
import type { Community, Post } from '@/lib/types'

interface PostCardProps {
  post: Post
  community: Community
}

export function PostCard({ post, community }: PostCardProps) {
  const { canInteract, postVote, postScore, votePost } = useInteractions()
  const [copied, setCopied] = useState(false)

  // Share does something now that posts have their own URL.
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/post/${post.id}`,
      )
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked (insecure origin or denied permission) */
    }
  }

  return (
    <article className="group flex gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40">
      <div className="pt-0.5">
        <VoteControl
          score={postScore(post.id, post.score)}
          vote={postVote(post.id)}
          disabled={!canInteract}
          onVote={(next) => votePost(post.id, next)}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <Link
            href={`/m/${community.slug}`}
            className="flex items-center gap-1.5 font-medium text-foreground hover:underline"
          >
            <CommunityAvatar community={community} className="size-5 text-[0.65rem]" />
            {communityLabel(community.slug)}
          </Link>
          <span aria-hidden>·</span>
          <span>
            Posted by{' '}
            {post.author === 'deleted' ? (
              userLabel(post.author)
            ) : (
              <Link
                href={`/u/${post.author}`}
                className="font-medium text-foreground hover:underline"
              >
                {userLabel(post.author)}
              </Link>
            )}{' '}
            · <TimeAgo at={post.createdAt} />
          </span>
          {post.flair && (
            <Badge variant="outline" className="ml-auto">
              {post.flair}
            </Badge>
          )}
        </div>

        <Link href={`/post/${post.id}`} className="mt-1.5 block w-full text-left">
          <h2 className="font-heading text-base font-semibold leading-snug text-balance text-foreground group-hover:text-primary">
            {post.title}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {post.body}
          </p>
          {post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt=""
              className="mt-2 max-h-48 w-full rounded-lg border border-border object-cover"
            />
          ) : null}
        </Link>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessageSquare className="size-3.5" />
            {formatCount(post.commentCount)} comments
          </Link>
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <Sparkles className="size-3.5" />
            Summarize with AI
          </Link>
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? (
              <Check className="size-3.5 text-success" />
            ) : (
              <Share2 className="size-3.5" />
            )}
            {copied ? 'Link copied' : 'Share'}
          </button>
        </div>
      </div>
    </article>
  )
}
