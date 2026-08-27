'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ImagePlus, PenSquare, X } from 'lucide-react'

import { CommunityAvatar } from '@/components/community-avatar'
import { useInteractions } from '@/components/interactions-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { accentClass } from '@/lib/accent'
import {
  assertValidPostImage,
  POST_IMAGE_MAX_BYTES,
} from '@/lib/browser-mutations'
import { communityLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Community } from '@/lib/types'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface CreatePostDialogProps {
  communities: Community[]
  defaultCommunityId?: string
  onCreate: (data: {
    communityId: string
    title: string
    body: string
    flair: string
    image?: File | null
  }) => void | Promise<void>
  trigger?: React.ReactNode
}

// Suggested flairs; custom text is also allowed (max 40 chars).
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
]

const FLAIR_MAX = 40

export function CreatePostDialog({
  communities,
  defaultCommunityId,
  onCreate,
  trigger,
}: CreatePostDialogProps) {
  const { isSubscribed } = useInteractions()

  const joined = useMemo(
    () => communities.filter((c) => isSubscribed(c.id)),
    [communities, isSubscribed],
  )

  const [open, setOpen] = useState(false)
  const [communityId, setCommunityId] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [flair, setFlair] = useState('Discussion')
  const [customFlairOpen, setCustomFlairOpen] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selected = useMemo(
    () => joined.find((c) => c.id === communityId) ?? joined[0],
    [joined, communityId],
  )

  function initialCommunityId() {
    if (defaultCommunityId && joined.some((c) => c.id === defaultCommunityId)) {
      return defaultCommunityId
    }
    return joined[0]?.id ?? ''
  }

  function clearImage() {
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function onPickImage(file: File | null) {
    if (!file) {
      clearImage()
      setError(null)
      return
    }

    try {
      assertValidPostImage(file)
    } catch (err) {
      clearImage()
      setError(err instanceof Error ? err.message : 'Invalid image.')
      return
    }

    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    setImage(file)
    setError(null)
  }

  useEffect(() => {
    if (open) {
      setCommunityId(initialCommunityId())
      setTitle('')
      setBody('')
      setFlair('Discussion')
      setCustomFlairOpen(false)
      clearImage()
      setPending(false)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when dialog opens
  }, [open, joined])

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  function onOpenChange(next: boolean) {
    if (pending && !next) return
    setOpen(next)
  }

  async function submit() {
    if (!title.trim() || !communityId) {
      setError('Pick a joined community and add a title.')
      return
    }
    if (!isSubscribed(communityId)) {
      setError('You can only post in communities you have joined.')
      return
    }

    const flairTrimmed = flair.trim()
    if (flairTrimmed.length > FLAIR_MAX) {
      setError(`Flair must be ${FLAIR_MAX} characters or fewer.`)
      return
    }

    if (image) {
      try {
        assertValidPostImage(image)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid image.')
        return
      }
    }

    setPending(true)
    setError(null)
    try {
      await onCreate({
        communityId,
        title: title.trim(),
        body: body.trim(),
        flair: flairTrimmed,
        image,
      })
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish your post.')
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button size="sm" aria-label="Create post" className="gap-1.5 px-2 sm:px-2.5">
              <PenSquare className="size-4" />
              <span className="hidden sm:inline">Create Post</span>
            </Button>
          )
        }
      />
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        {joined.length === 0 ? (
          <>
            <DialogBody className="px-4 py-6">
              <DialogHeader className="gap-1 text-left">
                <DialogTitle>Create a post</DialogTitle>
                <DialogDescription>
                  Join a community first — you can only post in forums you’ve joined.
                </DialogDescription>
              </DialogHeader>
              <p className="mt-3 text-sm text-muted-foreground">
                Use the + button next to a community in the sidebar, or create your own
                forum from the communities list.
              </p>
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button nativeButton={false} render={<Link href="/popular" />}>
                Browse communities
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="shrink-0">
              <div
                className={cn('h-16 w-full', accentClass(selected?.accent))}
                aria-hidden
              />
              <div className="relative px-4">
                {selected ? (
                  <CommunityAvatar
                    community={selected}
                    className="-mt-7 size-14 rounded-xl text-xl ring-4 ring-popover"
                  />
                ) : (
                  <div className="-mt-7 size-14 rounded-xl bg-muted ring-4 ring-popover" />
                )}
              </div>
            </div>

            <DialogBody className="px-4 pt-4">
              <DialogHeader className="mb-4 gap-1 text-left">
                <DialogTitle>Create a post</DialogTitle>
                <DialogDescription>
                  {selected
                    ? `Sharing in ${communityLabel(selected.slug)} — ${selected.name}.`
                    : 'Share a question, resource, or idea with a community you’ve joined.'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 pb-1">
                <div>
                  <label
                    htmlFor="post-community"
                    className="mb-1 block text-xs font-medium text-muted-foreground"
                  >
                    Community
                  </label>
                  <select
                    id="post-community"
                    value={communityId}
                    onChange={(e) => setCommunityId(e.target.value)}
                    disabled={pending}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                  >
                    {joined.map((c) => (
                      <option key={c.id} value={c.id}>
                        {communityLabel(c.slug)} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="post-title"
                    className="mb-1 block text-xs font-medium text-muted-foreground"
                  >
                    Title
                  </label>
                  <Input
                    id="post-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="An interesting, specific title"
                    maxLength={140}
                    autoFocus
                    disabled={pending}
                  />
                  <p className="mt-1 text-[0.7rem] text-muted-foreground">
                    {title.length}/140
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="post-body"
                    className="mb-1 block text-xs font-medium text-muted-foreground"
                  >
                    Body
                  </label>
                  <Textarea
                    id="post-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Add details, context, or your question…"
                    rows={4}
                    disabled={pending}
                  />
                </div>

                <div>
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Flair
                  </span>
                  <div
                    className="flex flex-wrap gap-1.5"
                    role="group"
                    aria-label="Post flair"
                  >
                    {FLAIR_SUGGESTIONS.map((f) => {
                      const selectedFlair = !customFlairOpen && flair === f
                      return (
                        <button
                          key={f}
                          type="button"
                          aria-pressed={selectedFlair}
                          disabled={pending}
                          onClick={() => {
                            setCustomFlairOpen(false)
                            setFlair(f)
                          }}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50',
                            selectedFlair
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border text-muted-foreground hover:bg-secondary',
                          )}
                        >
                          {f}
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      aria-pressed={customFlairOpen}
                      aria-controls="post-flair"
                      aria-expanded={customFlairOpen}
                      disabled={pending}
                      onClick={() => {
                        setCustomFlairOpen(true)
                        if (
                          flair === '' ||
                          FLAIR_SUGGESTIONS.includes(flair)
                        ) {
                          setFlair('')
                        }
                      }}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50',
                        customFlairOpen
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground hover:bg-secondary',
                      )}
                    >
                      Custom
                    </button>
                    <button
                      type="button"
                      aria-pressed={!customFlairOpen && flair === ''}
                      disabled={pending}
                      onClick={() => {
                        setCustomFlairOpen(false)
                        setFlair('')
                      }}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50',
                        !customFlairOpen && flair === ''
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground hover:bg-secondary',
                      )}
                    >
                      None
                    </button>
                  </div>
                  {customFlairOpen ? (
                    <div className="mt-2">
                      <label htmlFor="post-flair" className="sr-only">
                        Custom flair
                      </label>
                      <Input
                        id="post-flair"
                        value={flair}
                        onChange={(e) => setFlair(e.target.value)}
                        placeholder="Write a custom flair…"
                        maxLength={FLAIR_MAX}
                        autoFocus
                        disabled={pending}
                      />
                      <p className="mt-1 text-[0.7rem] text-muted-foreground">
                        {flair.trim().length}/{FLAIR_MAX}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div>
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Image <span className="font-normal">(optional)</span>
                  </span>
                  <input
                    ref={fileInputRef}
                    id="post-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={pending}
                    onChange={(e) =>
                      onPickImage(e.target.files?.[0] ?? null)
                    }
                  />
                  {imagePreview && image ? (
                    <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Selected preview"
                        className="mx-auto max-h-44 w-full object-contain"
                      />
                      <div className="flex items-center gap-2 border-t border-border bg-background/80 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-foreground">
                            {image.name}
                          </p>
                          <p className="text-[0.7rem] text-muted-foreground">
                            {formatBytes(image.size)} · max{' '}
                            {formatBytes(POST_IMAGE_MAX_BYTES)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => onPickImage(null)}
                          className="shrink-0 gap-1"
                        >
                          <X className="size-3.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        'flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-7 text-center transition-colors',
                        'hover:border-ring hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                        'disabled:pointer-events-none disabled:opacity-50',
                      )}
                    >
                      <ImagePlus className="size-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        Add an image
                      </span>
                      <span className="text-[0.7rem] text-muted-foreground">
                        JPEG, PNG, WebP, or GIF · up to{' '}
                        {formatBytes(POST_IMAGE_MAX_BYTES)}
                      </span>
                    </button>
                  )}
                </div>

                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={pending || !title.trim() || !communityId}
              >
                {pending
                  ? image
                    ? 'Uploading…'
                    : 'Posting…'
                  : 'Post'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
