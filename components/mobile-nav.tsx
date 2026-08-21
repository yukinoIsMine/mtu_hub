'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Dialog } from '@base-ui/react/dialog'
import { Menu, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LeftSidebar } from '@/components/left-sidebar'
import type { Community } from '@/lib/types'

/**
 * Community navigation for screens below `lg`, where both sidebars are hidden.
 *
 * Built on the Base UI dialog primitives rather than the DialogContent wrapper,
 * which hard-codes centred positioning. Using the primitives still gives focus
 * trapping, Escape to close, and background scroll locking.
 */
export function MobileNav({ communities }: { communities: Community[] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Close after navigating, otherwise the drawer covers the page you picked.
  useEffect(() => {
    setOpen(false)
  }, [pathname, searchParams])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open navigation"
            className="lg:hidden"
          />
        }
      >
        <Menu className="size-5" />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 duration-150 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0 lg:hidden" />

        <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-3 overflow-y-auto border-r border-border bg-background p-3 shadow-xl duration-150 outline-none data-closed:animate-out data-closed:slide-out-to-left data-open:animate-in data-open:slide-in-from-left lg:hidden">
          <div className="flex items-center justify-between px-1">
            <Dialog.Title className="font-heading text-base font-bold text-foreground">
              Browse
            </Dialog.Title>
            <Dialog.Close
              render={<Button variant="ghost" size="icon-sm" aria-label="Close navigation" />}
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <LeftSidebar communities={communities} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
