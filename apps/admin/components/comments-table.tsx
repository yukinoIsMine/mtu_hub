'use client'

import { Badge } from '@mtu/ui/badge'
import { Button } from '@mtu/ui/button'

import {
  hardDeleteComment,
  restoreComment,
  softDeleteComment,
} from '@/lib/actions/comments'

export type CommentRow = {
  id: string
  body: string
  score: number
  created_at: string
  deleted_at: string | null
  posts: { id: string; title: string } | null
  profiles: { username: string } | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function preview(body: string) {
  const trimmed = body.replace(/\s+/g, ' ').trim()
  return trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed
}

function CommentRowActions({ comment }: { comment: CommentRow }) {
  const deleted = Boolean(comment.deleted_at)

  return (
    <tr className="border-b border-border last:border-0 align-middle">
      <td className="max-w-xs px-3 py-1.5" title={comment.body}>
        <span className="line-clamp-2">{preview(comment.body)}</span>
      </td>
      <td className="max-w-[10rem] truncate px-3 py-1.5 text-muted-foreground">
        {comment.posts?.title ?? '—'}
      </td>
      <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">
        u/{comment.profiles?.username ?? 'unknown'}
      </td>
      <td className="px-3 py-1.5 tabular-nums text-muted-foreground">{comment.score}</td>
      <td className="px-3 py-1.5">
        {deleted ? (
          <Badge variant="destructive">deleted</Badge>
        ) : (
          <Badge variant="secondary">active</Badge>
        )}
      </td>
      <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground tabular-nums">
        {formatDate(comment.created_at)}
      </td>
      <td className="px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          {deleted ? (
            <form
              action={async () => {
                await restoreComment(comment.id)
              }}
            >
              <Button type="submit" size="xs" variant="secondary">
                Restore
              </Button>
            </form>
          ) : (
            <form
              action={async () => {
                await softDeleteComment(comment.id)
              }}
            >
              <Button type="submit" size="xs" variant="outline">
                Delete
              </Button>
            </form>
          )}
          <form
            action={async () => {
              if (confirm('Permanently purge this comment and its replies?')) {
                await hardDeleteComment(comment.id)
              }
            }}
          >
            <Button type="submit" size="xs" variant="destructive">
              Purge
            </Button>
          </form>
        </div>
      </td>
    </tr>
  )
}

export function CommentsTable({ comments }: { comments: CommentRow[] }) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">No comments found.</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Body</th>
            <th className="px-3 py-2 font-medium">Post</th>
            <th className="px-3 py-2 font-medium">Author</th>
            <th className="px-3 py-2 font-medium">Score</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Created</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {comments.map((comment) => (
            <CommentRowActions key={comment.id} comment={comment} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
