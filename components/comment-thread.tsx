'use client'

import { useState } from 'react'
import { CornerDownRight } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { VoteControl } from '@/components/vote-control'
import { initials, timeAgo } from '@/lib/format'
import type { Comment, VoteState } from '@/lib/types'

interface CommentThreadProps {
  comments: Comment[]
  votes: Record<string, VoteState>
  onVote: (commentId: string, next: VoteState) => void
  onReply: (parentId: string, body: string) => void
}

export function CommentThread({
  comments,
  votes,
  onVote,
  onReply,
}: CommentThreadProps) {
  const roots = comments.filter((c) => c.parentId === null)
  return (
    <div className="space-y-4">
      {roots.map((c) => (
        <CommentNode
          key={c.id}
          comment={c}
          comments={comments}
          votes={votes}
          onVote={onVote}
          onReply={onReply}
          depth={0}
        />
      ))}
    </div>
  )
}

function CommentNode({
  comment,
  comments,
  votes,
  onVote,
  onReply,
  depth,
}: {
  comment: Comment
  comments: Comment[]
  votes: Record<string, VoteState>
  onVote: (commentId: string, next: VoteState) => void
  onReply: (parentId: string, body: string) => void
  depth: number
}) {
  const [replying, setReplying] = useState(false)
  const [draft, setDraft] = useState('')
  const children = comments.filter((c) => c.parentId === comment.id)

  function submitReply() {
    if (!draft.trim()) return
    onReply(comment.id, draft.trim())
    setDraft('')
    setReplying(false)
  }

  return (
    <div className={depth > 0 ? 'border-l border-border pl-4' : undefined}>
      <div className="flex gap-2.5">
        <Avatar size="sm">
          <AvatarFallback className="bg-primary/10 text-primary">
            {initials(comment.author)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-foreground">{comment.author}</span>
            <span className="text-muted-foreground">
              {timeAgo(comment.createdAt)}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">
            {comment.body}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <VoteControl
              score={comment.score}
              vote={votes[comment.id] ?? 0}
              onVote={(next) => onVote(comment.id, next)}
              orientation="horizontal"
              size="sm"
            />
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setReplying((v) => !v)}
              className="text-muted-foreground"
            >
              <CornerDownRight className="size-3" />
              Reply
            </Button>
          </div>

          {replying && (
            <div className="mt-2 space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Reply to ${comment.author}…`}
                rows={2}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={submitReply} disabled={!draft.trim()}>
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReplying(false)
                    setDraft('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {children.length > 0 && (
            <div className="mt-3 space-y-3">
              {children.map((child) => (
                <CommentNode
                  key={child.id}
                  comment={child}
                  comments={comments}
                  votes={votes}
                  onVote={onVote}
                  onReply={onReply}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
