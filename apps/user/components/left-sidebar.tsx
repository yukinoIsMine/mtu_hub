'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flame, Home } from 'lucide-react'

import { CommunityAvatar } from '@/components/community-avatar'
import { CreateForumTrigger } from '@/components/create-community-dialog'
import { JoinLeaveButton } from '@/components/join-leave-button'
import { useInteractions } from '@/components/interactions-provider'
import { communityLabel, formatCount } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Community } from '@/lib/types'

export function LeftSidebar({
  communities,
  onCreateForum,
}: {
  communities: Community[]
  onCreateForum?: () => void
}) {
  const pathname = usePathname()
  const { canInteract } = useInteractions()

  return (
    <nav
      className="flex h-full min-h-0 flex-col gap-4 text-sm"
      aria-label="Communities"
    >
      <div className="shrink-0 rounded-xl border border-border bg-card p-2">
        <FeedLink
          href="/"
          icon={<Home className="size-4" />}
          label="Home"
          active={pathname === '/'}
        />
        <FeedLink
          href="/popular"
          icon={<Flame className="size-4" />}
          label="Popular"
          active={pathname === '/popular'}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card p-2">
        <p className="shrink-0 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your Communities
        </p>
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain">
          {communities.map((c) => {
            const href = `/m/${c.slug}`

            return (
              <li key={c.id} className="flex items-center gap-1">
                <Link
                  href={href}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-secondary',
                    pathname === href && 'bg-secondary',
                  )}
                >
                  <CommunityAvatar community={c} className="size-6 text-xs" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">
                      {communityLabel(c.slug)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatCount(c.members)} members
                    </span>
                  </span>
                </Link>

                <JoinLeaveButton
                  communityId={c.id}
                  slug={c.slug}
                  name={c.name}
                  variant="icon"
                />
              </li>
            )
          })}
        </ul>
        {canInteract && onCreateForum ? (
          <div className="shrink-0 border-t border-border pt-1">
            <CreateForumTrigger onClick={onCreateForum} />
          </div>
        ) : null}
      </div>
    </nav>
  )
}

function FeedLink({
  href,
  icon,
  label,
  active,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 font-medium transition-colors hover:bg-secondary',
        active ? 'bg-primary/10 text-primary' : 'text-foreground',
      )}
    >
      {icon}
      {label}
    </Link>
  )
}
