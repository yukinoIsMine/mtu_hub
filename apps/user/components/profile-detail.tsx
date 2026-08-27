'use client'

import Link from 'next/link'
import { ArrowLeft, CalendarDays, FileText } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatCount, formatDate, initials, userLabel } from '@/lib/format'
import type { Profile } from '@/lib/types'

interface ProfileDetailProps {
  profile: Profile
  postCount: number
  children: React.ReactNode
}

export function ProfileDetail({
  profile,
  postCount,
  children,
}: ProfileDetailProps) {
  const display = profile.displayName?.trim() || profile.username

  return (
    <div className="space-y-4">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to feed
      </Link>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-20 w-full bg-primary/15" aria-hidden />
        <div className="flex flex-wrap items-end gap-3 px-4 pb-4">
          <div className="-mt-8">
            <Avatar className="size-16 rounded-xl text-2xl ring-4 ring-card">
              {profile.avatarUrl ? (
                <AvatarImage src={profile.avatarUrl} alt={display} />
              ) : null}
              <AvatarFallback className="rounded-xl bg-primary text-primary-foreground">
                {initials(display)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-xl font-bold text-foreground">
              {display}
            </h1>
            <p className="text-sm text-muted-foreground">
              {userLabel(profile.username)}
            </p>
          </div>
        </div>

        <div className="border-t border-border px-4 py-4">
          {profile.bio?.trim() ? (
            <p className="text-sm leading-relaxed text-foreground/90">
              {profile.bio.trim()}
            </p>
          ) : null}

          <dl
            className={
              profile.bio?.trim()
                ? 'mt-4 grid grid-cols-2 gap-3 sm:max-w-md'
                : 'grid grid-cols-2 gap-3 sm:max-w-md'
            }
          >
            <Stat
              icon={<FileText className="size-4" />}
              label="Posts"
              value={formatCount(postCount)}
            />
            <Stat
              icon={<CalendarDays className="size-4" />}
              label="Joined"
              value={profile.createdAt ? formatDate(profile.createdAt) : '—'}
            />
          </dl>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-base font-bold text-foreground">
          Posts by {userLabel(profile.username)}
        </h2>
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
