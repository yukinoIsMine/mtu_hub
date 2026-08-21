'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flame, Home, Plus, Check } from 'lucide-react'

import { CommunityAvatar } from '@/components/community-avatar'
import { useInteractions } from '@/components/interactions-provider'
import { communityLabel, formatCount } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Community } from '@/lib/types'

export function LeftSidebar({ communities }: { communities: Community[] }) {
  const pathname = usePathname()
  const { canInteract, isSubscribed, toggleSubscribe } = useInteractions()

  return (
    <nav className="space-y-4 text-sm" aria-label="Communities">
      <div className="rounded-xl border border-border bg-card p-2">
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

      <div className="rounded-xl border border-border bg-card p-2">
        <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your Communities
        </p>
        <ul>
          {communities.map((c) => {
            const subscribed = isSubscribed(c.id)
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

                <button
                  type="button"
                  aria-label={
                    subscribed
                      ? `Leave ${communityLabel(c.slug)}`
                      : `Join ${communityLabel(c.slug)}`
                  }
                  disabled={!canInteract}
                  title={canInteract ? undefined : 'Sign in to join communities'}
                  onClick={() => toggleSubscribe(c.id)}
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                    !canInteract && 'cursor-not-allowed opacity-50',
                    subscribed
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-secondary',
                  )}
                >
                  {subscribed ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
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
