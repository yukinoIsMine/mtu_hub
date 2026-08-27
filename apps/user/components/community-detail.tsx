'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  CalendarDays,
  Settings,
  Shield,
  Users,
} from 'lucide-react'

import { useInteractions } from '@/components/interactions-provider'
import { JoinLeaveButton } from '@/components/join-leave-button'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CommunityAvatar } from '@/components/community-avatar'
import { accentClass } from '@/lib/accent'
import { communityLabel, formatCount, formatDate, userLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Community } from '@/lib/types'

interface CommunityDetailProps {
  community: Community
  postCount: number
  /** The sort bar and post list, rendered by the server page. */
  children: React.ReactNode
}

export function CommunityDetail({
  community,
  postCount,
  children,
}: CommunityDetailProps) {
  const { isForumAdmin } = useInteractions()
  const canManage = isForumAdmin(community.id)

  return (
    <div className="space-y-4">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to feed
      </Link>

      {/* Cover header */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className={cn('h-20 w-full', accentClass(community.accent))} aria-hidden />
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
            <p className="text-sm text-muted-foreground">
              {communityLabel(community.slug)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canManage ? (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/m/${community.slug}/settings`} />}
              >
                <Settings className="size-4" />
                Manage forum
              </Button>
            ) : null}
            <JoinLeaveButton
              communityId={community.id}
              slug={community.slug}
              name={community.name}
              variant="pill"
            />
          </div>
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

          {community.forumAdmins.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Shield className="size-3.5" />
                Forum admins
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {community.forumAdmins.map((admin) => (
                  <li key={admin} className="font-medium text-primary">
                    {userLabel(admin)}
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
            Posts in {communityLabel(community.slug)}
          </h2>
        </div>
        {children}
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
