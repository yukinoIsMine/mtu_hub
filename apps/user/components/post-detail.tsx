'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { AiSummaryCard } from '@/components/ai-summary-card'
import { CommentThread } from '@/components/comment-thread'
import { CommunityAvatar } from '@/components/community-avatar'
import { VoteControl } from '@/components/vote-control'
import { useInteractions } from '@/components/interactions-provider'
import { TimeAgo } from '@/components/time-ago'
import { assertValidPostImage } from '@/lib/browser-mutations'
import { communityLabel, formatCount, userLabel } from '@/lib/format'
import type { PostSummaryPayload } from '@/lib/ai/types'
import type { Comment, Community, Post } from '@/lib/types'

interface PostDetailProps {
  post: Post
  community: Community
  comments: Comment[]
  initialSummary?: PostSummaryPayload | null
}

export function PostDetail({
  post,
  community,
  comments,
  initialSummary = null,
}: PostDetailProps) {
  const {
    currentUser,
    canInteract,
    isForumAdmin,
    postVote,
    postScore,
    votePost,
    addComment,
    removePost,
    setPostImage,
  } = useInteractions()

  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [imageBusy, setImageBusy] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState(post.imageUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canModerate = isForumAdmin(community.id)
  const isAuthor =
    Boolean(currentUser) && post.author === currentUser?.username

  useEffect(() => {
    setImageUrl(post.imageUrl)
  }, [post.imageUrl])

  async function submit() {
    if (!draft.trim() || submitting) return

    setSubmitting(true)
    await addComment(post.id, draft.trim(), null)
    setSubmitting(false)
    setDraft('')
  }

  async function onRemovePost() {
    if (
      !confirm(
        isAuthor && !canModerate
          ? 'Remove this post? It will no longer appear in feeds.'
          : 'Remove this post from the forum?',
      )
    ) {
      return
    }
    setRemoving(true)
    try {
      await removePost(post.id)
    } catch {
      setRemoving(false)
    }
  }

  async function onReplaceImage(file: File | null) {
    if (!file) return
    setImageBusy(true)
    setImageError(null)
    try {
      assertValidPostImage(file)
      const next = await setPostImage(post.id, file, imageUrl)
      setImageUrl(next)
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Could not update image.')
    } finally {
      setImageBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function onClearImage() {
    if (!confirm('Remove the image from this post?')) return
    setImageBusy(true)
    setImageError(null)
    try {
      await setPostImage(post.id, null, imageUrl)
      setImageUrl(null)
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Could not remove image.')
    } finally {
      setImageBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href="/" />}
        className="text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to feed
      </Button>

      <div className="rounded-xl border border-border bg-card p-4">
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

        <h1 className="mt-2 font-heading text-xl font-bold leading-tight text-balance text-foreground">
          {post.title}
        </h1>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
          {post.body}
        </p>

        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={imageUrl}
            src={imageUrl}
            alt=""
            className="mt-3 w-full rounded-lg border border-border object-contain"
          />
        ) : null}

        {isAuthor ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => void onReplaceImage(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={imageBusy}
              onClick={() => fileInputRef.current?.click()}
            >
              {imageBusy
                ? 'Updating…'
                : imageUrl
                  ? 'Replace image'
                  : 'Add image'}
            </Button>
            {imageUrl ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={imageBusy}
                onClick={() => void onClearImage()}
              >
                Remove image
              </Button>
            ) : null}
            {imageError ? (
              <p className="w-full text-sm text-destructive" role="alert">
                {imageError}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <VoteControl
            score={postScore(post.id, post.score)}
            vote={postVote(post.id)}
            disabled={!canInteract}
            onVote={(next) => votePost(post.id, next)}
            orientation="horizontal"
          />
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MessageSquare className="size-3.5" />
            {formatCount(comments.length)} comments
          </span>
          {canModerate || isAuthor ? (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-destructive"
              disabled={removing}
              onClick={onRemovePost}
            >
              {removing ? 'Removing…' : 'Remove post'}
            </Button>
          ) : null}
        </div>
      </div>

      <AiSummaryCard
        key={post.id}
        post={post}
        comments={comments}
        initialSummary={initialSummary}
      />

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          Add a comment
        </h2>

        {canInteract ? (
          <>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Share your thoughts with the MTU community…"
              rows={3}
              className="mt-2"
            />
            <div className="mt-2 flex justify-end">
              <Button size="sm" onClick={submit} disabled={!draft.trim() || submitting}>
                {submitting ? 'Posting…' : 'Comment'}
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>{' '}
            to join the discussion.
          </p>
        )}
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
            postId={post.id}
            communityId={community.id}
          />
        )}
      </div>
    </div>
  )
}
