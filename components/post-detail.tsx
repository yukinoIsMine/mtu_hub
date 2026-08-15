'use client'

import { useState } from 'react'
import { ArrowLeft, MessageSquare } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { AiSummaryCard } from '@/components/ai-summary-card'
import { CommentThread } from '@/components/comment-thread'
import { CommunityAvatar } from '@/components/community-avatar'
import { VoteControl } from '@/components/vote-control'
import { formatCount, timeAgo } from '@/lib/format'
import type { Comment, Community, Post, VoteState } from '@/lib/types'

interface PostDetailProps {
  post: Post
  community: Community
  comments: Comment[]
  postVote: VoteState
  commentVotes: Record<string, VoteState>
  onVotePost: (next: VoteState) => void
  onVoteComment: (commentId: string, next: VoteState) => void
  onAddComment: (body: string, parentId: string | null) => void
  onBack: () => void
  onOpenCommunity: () => void
}

export function PostDetail({
  post,
  community,
  comments,
  postVote,
  commentVotes,
  onVotePost,
  onVoteComment,
  onAddComment,
  onBack,
  onOpenCommunity,
}: PostDetailProps) {
  const [draft, setDraft] = useState('')

  function submit() {
    if (!draft.trim()) return
    onAddComment(draft.trim(), null)
    setDraft('')
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
        <ArrowLeft className="size-4" />
        Back to feed
      </Button>

      <div className="rounded-xl border border-border bg-card p-4">
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

        <h1 className="mt-2 font-heading text-xl font-bold leading-tight text-balance text-foreground">
          {post.title}
        </h1>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
          {post.body}
        </p>

        <div className="mt-3 flex items-center gap-3">
          <VoteControl
            score={post.score}
            vote={postVote}
            onVote={onVotePost}
            orientation="horizontal"
          />
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MessageSquare className="size-3.5" />
            {formatCount(comments.length)} comments
          </span>
        </div>
      </div>

      <AiSummaryCard post={post} comments={comments} />

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          Add a comment
        </h2>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Share your thoughts with the MTU community…"
          rows={3}
          className="mt-2"
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={submit} disabled={!draft.trim()}>
            Comment
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold text-foreground">
            {formatCount(comments.length)} Comments
          </h2>
        </div>
        <Separator className="mb-4" />
        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No comments yet. Be the first to reply.
          </p>
        ) : (
          <CommentThread
            comments={comments}
            votes={commentVotes}
            onVote={onVoteComment}
            onReply={(parentId, body) => onAddComment(body, parentId)}
          />
        )}
      </div>
    </div>
  )
}
