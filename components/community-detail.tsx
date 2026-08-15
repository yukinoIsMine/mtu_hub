'use client'

import {
  ArrowLeft,
  CalendarDays,
  Check,
  Plus,
  Shield,
  Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { CommunityAvatar } from '@/components/community-avatar'
import { formatCount, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Community } from '@/lib/types'

interface CommunityDetailProps {
  community: Community
  subscribed: boolean
  postCount: number
  onToggleSubscribe: () => void
  onBack: () => void
  sortBar: React.ReactNode
  postsSlot: React.ReactNode
}

export function CommunityDetail({
  community,
  subscribed,
  postCount,
  onToggleSubscribe,
  onBack,
  sortBar,
  postsSlot,
}: CommunityDetailProps) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to feed
      </button>

      {/* Cover header */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className={cn('h-20 w-full', community.colorClass)} aria-hidden />
        <div className="flex flex-wrap items-end gap-3 px-4 pb-4">
          <div className="-mt-8">
            <CommunityAvatar
              community={community}
              className="size-16 rounded-xl text-2xl ring-4 ring-card"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-xl font-bold text-foreground">
              {community.name}
            </h1>
            <p className="text-sm text-muted-foreground">{community.slug}</p>
          </div>
          <button
            type="button"
            onClick={onToggleSubscribe}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
              subscribed
                ? 'border border-primary bg-primary/10 text-primary hover:bg-primary/20'
                : 'bg-primary text-primary-foreground hover:opacity-90',
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
                Join
              </>
            )}
          </button>
        </div>
      </div>

      {/* About + rules */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-heading text-sm font-semibold text-foreground">
            About this community
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            {community.description}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-3">
            <Stat
              icon={<Users className="size-4" />}
              label="Members"
              value={formatCount(community.members)}
            />
            <Stat
              icon={
                <span
                  className="size-2.5 rounded-full bg-success"
                  aria-hidden
                />
              }
              label="Online now"
              value={formatCount(community.online ?? 0)}
            />
            <Stat
              icon={<CalendarDays className="size-4" />}
              label="Created"
              value={
                community.foundedAt ? formatDate(community.foundedAt) : '—'
              }
            />
            <Stat
              icon={<Shield className="size-4" />}
              label="Posts"
              value={formatCount(postCount)}
            />
          </dl>

          {community.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {community.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {community.moderators && community.moderators.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Shield className="size-3.5" />
                Moderators
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {community.moderators.map((mod) => (
                  <li key={mod} className="font-medium text-primary">
                    {mod}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Community rules
          </h2>
          <ol className="mt-2 space-y-2">
            {(community.rules ?? []).map((rule, i) => (
              <li key={rule} className="flex gap-2.5 text-sm">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="leading-relaxed text-foreground/90">
                  {rule}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-base font-bold text-foreground">
            Posts in {community.slug}
          </h2>
        </div>
        {sortBar}
        {postsSlot}
      </div>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">
          {value}
        </span>
        <span className="block text-xs text-muted-foreground">{label}</span>
      </span>
    </div>
  )
}
