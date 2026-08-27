'use client'

import { useState, useTransition } from 'react'
import { LogOut } from 'lucide-react'

import { signOut } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function SignOutButton() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function confirmSignOut() {
    startTransition(async () => {
      await signOut()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Sign out"
            className="text-muted-foreground"
          />
        }
      >
        <LogOut className="size-4" />
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sign out?</DialogTitle>
          <DialogDescription>
            You’ll need to log in again to vote, post, or manage your communities.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={confirmSignOut}
          >
            {pending ? 'Signing out…' : 'Sign out'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
