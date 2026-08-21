'use client'

import { useState } from 'react'
import { CornerDownRight } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { VoteControl } from '@/components/vote-control'
import { useInteractions } from '@/components/interactions-provider'
import { TimeAgo } from '@/components/time-ago'
import { initials, userLabel } from '@/lib/format'
import type { Comment } from '@/lib/types'

export function CommentThread({
  comments,
  postId,
}: {
  comments: Comment[]
  postId: string
}) {
  const roots = comments.filter((c) => c.parentId === null)

  return (
    <div className="space-y-4">
      {roots.map((c) => (
        <CommentNode key={c.id} comment={c} comments={comments} postId={postId} depth={0} />
      ))}
    </div>
  )
}

function CommentNode({
  comment,
  comments,
  postId,
  depth,
}: {
  comment: Comment
  comments: Comment[]
  postId: string
  depth: number
}) {
  const { canInteract, commentVote, commentScore, voteComment, addComment } =
    useInteractions()

  const [replying, setReplying] = useState(false)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const children = comments.filter((c) => c.parentId === comment.id)

  async function submitReply() {
    if (!draft.trim() || submitting) return

    setSubmitting(true)
    await addComment(postId, draft.trim(), comment.id)
    setSubmitting(false)
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
            <span className="font-medium text-foreground">
              {userLabel(comment.author)}
            </span>
            <TimeAgo at={comment.createdAt} className="text-muted-foreground" />
          </div>
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">
            {comment.body}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <VoteControl
              score={commentScore(comment.id, comment.score)}
              vote={commentVote(comment.id)}
              disabled={!canInteract}
              onVote={(next) => voteComment(comment.id, next)}
              orientation="horizontal"
              size="sm"
            />
            {canInteract && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setReplying((v) => !v)}
                className="text-muted-foreground"
              >
                <CornerDownRight className="size-3" />
                Reply
              </Button>
            )}
          </div>

          {replying && (
            <div className="mt-2 space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Reply to ${userLabel(comment.author)}…`}
                rows={2}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={submitReply}
                  disabled={!draft.trim() || submitting}
                >
                  {submitting ? 'Posting…' : 'Reply'}
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
                  postId={postId}
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
