'use client'

import Link from 'next/link'
import Image from 'next/image'
import { PenSquare } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CreatePostDialog } from '@/components/create-post-dialog'
import { MobileNav } from '@/components/mobile-nav'
import { NotificationBell } from '@/components/notification-bell'
import { SearchBox } from '@/components/search-box'
import { SignOutButton } from '@/components/sign-out-button'
import { useInteractions } from '@/components/interactions-provider'
import { initials, userLabel } from '@/lib/format'
import type { Community } from '@/lib/types'

export function SiteHeader({
  communities,
  onCreateForum,
}: {
  communities: Community[]
  onCreateForum?: () => void
}) {
  const { currentUser, createPost } = useInteractions()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto grid h-14 max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 px-3 sm:gap-3 sm:px-4 md:grid-cols-[1fr_minmax(12rem,28rem)_1fr]">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <MobileNav communities={communities} onCreateForum={onCreateForum} />

          <Link
            href="/"
            className="flex shrink-0 items-center gap-2"
            aria-label="MTU Hub home"
          >
            <Image
              src="/logo.jpeg"
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-lg object-cover"
              priority
            />
            <span className="hidden font-heading text-lg font-bold text-foreground sm:inline">
              MTU<span className="text-primary">Hub</span>
            </span>
          </Link>
        </div>

        <div className="min-w-0 w-full justify-self-stretch md:justify-self-center">
          <SearchBox />
        </div>

        <div className="flex items-center justify-end gap-0.5 sm:gap-1.5">
          {currentUser ? (
            <>
              <CreatePostDialog
                communities={communities}
                onCreate={createPost}
                trigger={
                  <Button
                    size="sm"
                    aria-label="Create post"
                    className="gap-1.5 px-2 sm:px-2.5"
                  >
                    <PenSquare className="size-4" />
                    <span className="hidden sm:inline">Create Post</span>
                  </Button>
                }
              />

              <NotificationBell />

              <Link
                href={`/u/${currentUser.username}`}
                aria-label={`View profile ${userLabel(currentUser.username)}`}
                className="rounded-full outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
              >
                <Avatar size="sm">
                  <AvatarFallback
                    className="bg-primary text-primary-foreground"
                    title={userLabel(currentUser.username)}
                  >
                    {initials(currentUser.displayName ?? currentUser.username)}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <SignOutButton />
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/auth/login" />}
                className="px-2 sm:px-2.5"
              >
                Log in
              </Button>
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/auth/sign-up" />}
                className="hidden sm:inline-flex"
              >
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
