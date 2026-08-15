'use client'

import { useState } from 'react'
import { PenSquare } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Community } from '@/lib/types'

interface CreatePostDialogProps {
  communities: Community[]
  defaultCommunityId?: string
  onCreate: (data: {
    communityId: string
    title: string
    body: string
    flair: string
  }) => void
  trigger?: React.ReactNode
}

const FLAIRS = ['Discussion', 'Help', 'Resource', 'Project', 'Event', 'Guide']

export function CreatePostDialog({
  communities,
  defaultCommunityId,
  onCreate,
  trigger,
}: CreatePostDialogProps) {
  const [open, setOpen] = useState(false)
  const [communityId, setCommunityId] = useState(
    defaultCommunityId ?? communities[0]?.id,
  )
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [flair, setFlair] = useState('Discussion')

  function submit() {
    if (!title.trim() || !communityId) return
    onCreate({ communityId, title: title.trim(), body: body.trim(), flair })
    setTitle('')
    setBody('')
    setFlair('Discussion')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button size="sm">
              <PenSquare className="size-4" />
              Create Post
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a post</DialogTitle>
          <DialogDescription>
            Share a question, resource, or idea with your MTU community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Community
            </label>
            <select
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.slug} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="An interesting, specific title"
              maxLength={140}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Body
            </label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add details, context, or your question…"
              rows={4}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Flair
            </label>
            <div className="flex flex-wrap gap-1.5">
              {FLAIRS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFlair(f)}
                  className={
                    'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ' +
                    (flair === f
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:bg-secondary')
                  }
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!title.trim()}>
            Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
