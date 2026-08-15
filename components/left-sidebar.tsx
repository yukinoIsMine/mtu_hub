'use client'

import { Flame, Home, Plus, Check } from 'lucide-react'

import { CommunityAvatar } from '@/components/community-avatar'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Community } from '@/lib/types'

interface LeftSidebarProps {
  communities: Community[]
  subscribed: Set<string>
  activeCommunityId: string | null
  feedMode: 'home' | 'popular'
  onSelectFeed: (mode: 'home' | 'popular') => void
  onSelectCommunity: (id: string) => void
  onToggleSubscribe: (id: string) => void
}

export function LeftSidebar({
  communities,
  subscribed,
  activeCommunityId,
  feedMode,
  onSelectFeed,
  onSelectCommunity,
  onToggleSubscribe,
}: LeftSidebarProps) {
  return (
    <nav className="space-y-4 text-sm" aria-label="Communities">
      <div className="rounded-xl border border-border bg-card p-2">
        <FeedItem
          icon={<Home className="size-4" />}
          label="Home"
          active={feedMode === 'home' && !activeCommunityId}
          onClick={() => onSelectFeed('home')}
        />
        <FeedItem
          icon={<Flame className="size-4" />}
          label="Popular"
          active={feedMode === 'popular' && !activeCommunityId}
          onClick={() => onSelectFeed('popular')}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-2">
        <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your Communities
        </p>
        <ul>
          {communities.map((c) => {
            const isSub = subscribed.has(c.id)
            return (
              <li key={c.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSelectCommunity(c.id)}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-secondary',
                    activeCommunityId === c.id && 'bg-secondary',
                  )}
                >
                  <CommunityAvatar community={c} className="size-6 text-xs" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">
                      {c.slug}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatCount(c.members)} members
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={isSub ? `Leave ${c.slug}` : `Join ${c.slug}`}
                  onClick={() => onToggleSubscribe(c.id)}
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                    isSub
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-secondary',
                  )}
                >
                  {isSub ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

function FeedItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 font-medium transition-colors hover:bg-secondary',
        active ? 'bg-primary/10 text-primary' : 'text-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
