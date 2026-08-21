'use client'

import { X } from 'lucide-react'

import { LeftSidebar } from '@/components/left-sidebar'
import { RightSidebar } from '@/components/right-sidebar'
import { SiteHeader } from '@/components/site-header'
import { useInteractions } from '@/components/interactions-provider'
import type { ScoredPost } from '@/lib/recommendations'
import type { Community, Post } from '@/lib/types'

interface AppShellProps {
  communities: Community[]
  recommendations: ScoredPost[]
  trending: Post[]
  children: React.ReactNode
}

export function AppShell({
  communities,
  recommendations,
  trending,
  children,
}: AppShellProps) {
  const { error, clearError } = useInteractions()

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader communities={communities} />

      {error && (
        <div className="border-b border-destructive/30 bg-destructive/10">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
            <p role="alert" className="flex-1 text-sm text-destructive">
              {error}
            </p>
            <button
              type="button"
              onClick={clearError}
              aria-label="Dismiss"
              className="text-destructive/70 transition-colors hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <LeftSidebar communities={communities} />
          </div>
        </div>

        <main className="min-w-0">{children}</main>

        {/* Below lg this falls under the feed rather than disappearing, so
            recommendations and trending stay reachable on a phone. */}
        <div>
          <div className="lg:sticky lg:top-20">
            <RightSidebar
              recommendations={recommendations}
              trending={trending}
              communities={communities}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
