'use client'

import { useActionState } from 'react'
import {
  ImageOff,
  MessageSquare,
  RotateCcw,
  Save,
  Trash2,
  ArrowUp,
} from 'lucide-react'

import { Badge } from '@mtu/ui/badge'
import { Button } from '@mtu/ui/button'
import { Input } from '@mtu/ui/input'
import { Label } from '@mtu/ui/label'

import {
  clearPostImage,
  hardDeletePost,
  restorePost,
  softDeletePost,
  updatePost,
} from '@/lib/actions/posts'
import type { ActionResult } from '@/lib/actions/users'

const FLAIR_SUGGESTIONS = [
  'Discussion',
  'Help',
  'Resource',
  'Project',
  'Event',
  'Guide',
  'Announcement',
  'Challenge',
  'Study Group',
] as const

const FLAIR_MAX = 40

export type PostRow = {
  id: string
  title: string
  flair: string | null
  image_url: string | null
  score: number
  comment_count: number
  created_at: string
  deleted_at: string | null
  communities: { slug: string; name: string } | null
  profiles: { username: string } | null
}

const initial: ActionResult = { error: null }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function PostCard({ post }: { post: PostRow }) {
  const [state, action, pending] = useActionState(updatePost, initial)
  const deleted = Boolean(post.deleted_at)
  const formId = `post-${post.id}`
  const forumSlug = post.communities?.slug ?? '?'
  const forumName = post.communities?.name
  const author = post.profiles?.username ?? 'unknown'

  return (
    <article
      className={`rounded-xl border bg-card p-4 shadow-xs transition-colors ${
        deleted ? 'border-destructive/25 bg-destructive/5' : 'border-border'
      }`}
    >
      <div className="flex gap-4">
        <div className="shrink-0">
          {post.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.image_url}
              alt=""
              className="size-20 rounded-lg border border-border object-cover sm:size-24"
            />
          ) : (
            <div className="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground sm:size-24">
              <ImageOff className="size-5 opacity-60" />
              <span className="text-[0.65rem]">No image</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <form id={formId} action={action}>
                <input type="hidden" name="id" value={post.id} />
                <Label htmlFor={`${formId}-title`} className="sr-only">
                  Title
                </Label>
                <Input
                  id={`${formId}-title`}
                  name="title"
                  defaultValue={post.title}
                  required
                  maxLength={140}
                  className="h-9 font-medium"
                  aria-label="Title"
                />
              </form>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  m/{forumSlug}
                </span>
                {forumName ? (
                  <span className="hidden text-muted-foreground sm:inline">
                    · {forumName}
                  </span>
                ) : null}
                <span aria-hidden>·</span>
                <span>u/{author}</span>
                <span aria-hidden>·</span>
                <span className="tabular-nums">{formatDate(post.created_at)}</span>
              </div>
            </div>
            {deleted ? (
              <Badge variant="destructive">Deleted</Badge>
            ) : (
              <Badge variant="secondary">Active</Badge>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex min-w-[10rem] flex-1 flex-col gap-1 sm:max-w-xs">
              <Label
                htmlFor={`${formId}-flair`}
                className="text-xs text-muted-foreground"
              >
                Flair
              </Label>
              <Input
                id={`${formId}-flair`}
                form={formId}
                name="flair"
                defaultValue={post.flair ?? ''}
                maxLength={FLAIR_MAX}
                list={`${formId}-flair-suggestions`}
                placeholder="Optional — or pick a suggestion"
                className="h-8"
                aria-label="Flair"
              />
              <datalist id={`${formId}-flair-suggestions`}>
                {FLAIR_SUGGESTIONS.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 tabular-nums">
                <ArrowUp className="size-3.5" />
                {post.score}
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <MessageSquare className="size-3.5" />
                {post.comment_count}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Button form={formId} type="submit" size="sm" disabled={pending}>
              <Save className="size-3.5" />
              {pending ? 'Saving…' : 'Save'}
            </Button>

            {post.image_url ? (
              <form
                action={async () => {
                  if (confirm('Remove the image from this post?')) {
                    await clearPostImage(post.id)
                  }
                }}
              >
                <Button type="submit" size="sm" variant="outline">
                  <ImageOff className="size-3.5" />
                  Clear image
                </Button>
              </form>
            ) : null}

            {deleted ? (
              <form
                action={async () => {
                  await restorePost(post.id)
                }}
              >
                <Button type="submit" size="sm" variant="secondary">
                  <RotateCcw className="size-3.5" />
                  Restore
                </Button>
              </form>
            ) : (
              <form
                action={async () => {
                  await softDeletePost(post.id)
                }}
              >
                <Button type="submit" size="sm" variant="outline">
                  Soft delete
                </Button>
              </form>
            )}

            <form
              className="sm:ml-auto"
              action={async () => {
                if (
                  confirm(
                    'Permanently purge this post and all of its comments? This cannot be undone.',
                  )
                ) {
                  await hardDeletePost(post.id)
                }
              }}
            >
              <Button type="submit" size="sm" variant="destructive">
                <Trash2 className="size-3.5" />
                Purge
              </Button>
            </form>

            {state.error ? (
              <p
                className="w-full text-sm text-destructive"
                role="alert"
                title={state.error}
              >
                {state.error}
              </p>
            ) : state.ok ? (
              <p className="text-sm text-success">Saved</p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

export function PostsTable({ posts }: { posts: PostRow[] }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center">
        <p className="text-sm font-medium text-foreground">No posts found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try a different search, forum, or status filter.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Showing {posts.length} post{posts.length === 1 ? '' : 's'}
      </p>
      <ul className="space-y-3">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard post={post} />
          </li>
        ))}
      </ul>
    </div>
  )
}
