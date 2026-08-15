'use client'

import { GraduationCap, Search } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CreatePostDialog } from '@/components/create-post-dialog'
import { initials } from '@/lib/format'
import type { Community } from '@/lib/types'

interface SiteHeaderProps {
  query: string
  onQueryChange: (q: string) => void
  communities: Community[]
  currentUser: string
  onCreate: (data: {
    communityId: string
    title: string
    body: string
    flair: string
  }) => void
  onHome: () => void
}

export function SiteHeader({
  query,
  onQueryChange,
  communities,
  currentUser,
  onCreate,
  onHome,
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <button
          type="button"
          onClick={onHome}
          className="flex shrink-0 items-center gap-2"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="hidden font-heading text-lg font-bold text-foreground sm:block">
            MTU<span className="text-primary">Hub</span>
          </span>
        </button>

        <div className="relative mx-auto w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search MTU Hub"
            className="h-9 w-full rounded-full border border-input bg-secondary/60 pl-9 pr-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/40"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <CreatePostDialog communities={communities} onCreate={onCreate} />
          <Avatar size="sm">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials(currentUser)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
