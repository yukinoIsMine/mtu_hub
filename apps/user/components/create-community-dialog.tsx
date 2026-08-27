'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { accentClass, type CommunityAccent } from '@/lib/accent'
import { communityLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

const ACCENTS: CommunityAccent[] = [
  'teal',
  'teal_deep',
  'orange',
  'blue',
  'green',
  'navy',
  'emerald',
  'indigo',
]

const SLUG_RE = /^[A-Za-z0-9]{2,32}$/

function slugify(value: string) {
  return value.replace(/[^A-Za-z0-9]/g, '').slice(0, 32)
}

export type CreateCommunityInput = {
  slug: string
  name: string
  description: string
  accent: CommunityAccent
  tags: string[]
  rules: string[]
}

interface CreateCommunityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (data: CreateCommunityInput) => Promise<void>
}

export function CreateCommunityDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateCommunityDialogProps) {
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [accent, setAccent] = useState<CommunityAccent>('teal')
  const [tags, setTags] = useState('')
  const [rules, setRules] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewLetter = useMemo(() => {
    const source = slug || name
    return (source.charAt(0) || 'M').toUpperCase()
  }, [slug, name])

  function reset() {
    setSlug('')
    setSlugTouched(false)
    setName('')
    setDescription('')
    setAccent('teal')
    setTags('')
    setRules('')
    setError(null)
    setPending(false)
  }

  useEffect(() => {
    if (!open) reset()
  }, [open])

  async function submit() {
    const cleanSlug = slug.trim()
    const cleanName = name.trim()
    if (!cleanSlug || !cleanName) {
      setError('Name and slug are required.')
      return
    }
    if (!SLUG_RE.test(cleanSlug)) {
      setError('Slug must be 2–32 letters or digits (no spaces).')
      return
    }

    setPending(true)
    setError(null)
    try {
      await onCreate({
        slug: cleanSlug,
        name: cleanName,
        description: description.trim(),
        accent,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        rules: rules
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean),
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create forum.')
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <div className="shrink-0">
          <div className={cn('h-16 w-full', accentClass(accent))} aria-hidden />
          <div className="relative px-4">
            <div
              className={cn(
                '-mt-7 flex size-14 items-center justify-center rounded-xl text-xl font-bold ring-4 ring-popover',
                accentClass(accent),
              )}
              aria-hidden
            >
              {previewLetter}
            </div>
          </div>
        </div>

        <DialogBody className="px-4 pt-4">
          <DialogHeader className="mb-4 gap-1 text-left">
            <DialogTitle>Create a forum</DialogTitle>
            <DialogDescription>
              {slug.trim().length >= 2
                ? `Your community will live at ${communityLabel(slug.trim())}. You’ll be the first forum admin.`
                : 'Start a community for a department, club, or topic. You’ll be the first forum admin.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pb-1">
            <div>
              <label
                htmlFor="forum-name"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Name
              </label>
              <Input
                id="forum-name"
                value={name}
                onChange={(e) => {
                  const next = e.target.value
                  setName(next)
                  if (!slugTouched) setSlug(slugify(next))
                }}
                placeholder="Electrical Engineering"
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="forum-slug"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Address
              </label>
              <div className="flex h-8 items-center overflow-hidden rounded-lg border border-input bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                <span className="shrink-0 border-r border-input bg-muted/40 px-2.5 text-sm text-muted-foreground">
                  m/
                </span>
                <input
                  id="forum-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(slugify(e.target.value))
                  }}
                  placeholder="EEE"
                  maxLength={32}
                  className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <p className="mt-1 text-[0.7rem] text-muted-foreground">
                2–32 letters or digits. Shown as m/Slug in the app.
              </p>
            </div>

            <div>
              <label
                htmlFor="forum-desc"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Description
              </label>
              <Textarea
                id="forum-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What will people talk about here?"
              />
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Color
              </span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Forum color">
                {ACCENTS.map((a) => {
                  const selected = accent === a
                  return (
                    <button
                      key={a}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={a.replace('_', ' ')}
                      title={a.replace('_', ' ')}
                      onClick={() => setAccent(a)}
                      className={cn(
                        'size-7 rounded-full transition-transform',
                        accentClass(a),
                        selected
                          ? 'scale-110 ring-2 ring-foreground/25 ring-offset-2 ring-offset-popover'
                          : 'opacity-80 hover:opacity-100',
                      )}
                    />
                  )
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="forum-tags"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Tags
              </label>
              <Input
                id="forum-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="engineering, hardware"
              />
            </div>

            <div>
              <label
                htmlFor="forum-rules"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Rules <span className="font-normal">(optional, one per line)</span>
              </label>
              <Textarea
                id="forum-rules"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={3}
                placeholder={'Be respectful\nStay on topic'}
              />
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
            disabled={pending || !name.trim() || !slug.trim()}
          >
            {pending ? 'Creating…' : 'Create forum'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CreateForumTrigger({
  onClick,
}: {
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <span className="flex size-6 items-center justify-center rounded-full border border-dashed border-border">
        <Plus className="size-3.5" />
      </span>
      Create a forum
    </button>
  )
}
