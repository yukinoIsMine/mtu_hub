'use client'

import { useState } from 'react'
import { Check, Plus } from 'lucide-react'

import { useInteractions } from '@/components/interactions-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { communityLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

type Variant = 'pill' | 'icon'

interface JoinLeaveButtonProps {
  communityId: string
  slug: string
  name: string
  variant?: Variant
  className?: string
}

export function JoinLeaveButton({
  communityId,
  slug,
  name,
  variant = 'pill',
  className,
}: JoinLeaveButtonProps) {
  const { canInteract, isSubscribed, toggleSubscribe } = useInteractions()
  const subscribed = isSubscribed(communityId)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const label = communityLabel(slug)

  async function join() {
    if (!canInteract || pending) return
    setPending(true)
    try {
      await toggleSubscribe(communityId)
    } finally {
      setPending(false)
    }
  }

  async function leave() {
    if (!canInteract || pending) return
    setPending(true)
    try {
      await toggleSubscribe(communityId)
      setConfirmOpen(false)
    } finally {
      setPending(false)
    }
  }

  function onTriggerClick() {
    if (!canInteract || pending) return
    if (subscribed) {
      setConfirmOpen(true)
      return
    }
    void join()
  }

  return (
    <>
      {variant === 'pill' ? (
        <button
          type="button"
          onClick={onTriggerClick}
          disabled={!canInteract || pending}
          title={canInteract ? undefined : 'Sign in to join communities'}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
            (!canInteract || pending) && 'cursor-not-allowed opacity-50',
            subscribed
              ? 'border border-primary bg-primary/10 text-primary hover:bg-primary/20'
              : 'bg-primary text-primary-foreground hover:opacity-90',
            className,
          )}
        >
          {subscribed ? (
            <>
              <Check className="size-4" />
              Joined
            </>
          ) : (
            <>
              <Plus className="size-4" />
              {pending ? 'Joining…' : 'Join'}
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          aria-label={subscribed ? `Leave ${label}` : `Join ${label}`}
          disabled={!canInteract || pending}
          title={canInteract ? undefined : 'Sign in to join communities'}
          onClick={onTriggerClick}
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors',
            (!canInteract || pending) && 'cursor-not-allowed opacity-50',
            subscribed
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:bg-secondary',
            className,
          )}
        >
          {subscribed ? (
            <Check className="size-3.5" />
          ) : (
            <Plus className="size-3.5" />
          )}
        </button>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Leave {label}?</DialogTitle>
            <DialogDescription>
              You’ll leave {name}. You can join again anytime, but you won’t be
              able to post there until you do.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => void leave()}
            >
              {pending ? 'Leaving…' : 'Leave forum'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
