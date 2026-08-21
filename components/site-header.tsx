'use client'

import Link from 'next/link'
import { GraduationCap, LogOut } from 'lucide-react'

import { signOut } from '@/app/auth/actions'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CreatePostDialog } from '@/components/create-post-dialog'
import { MobileNav } from '@/components/mobile-nav'
import { SearchBox } from '@/components/search-box'
import { useInteractions } from '@/components/interactions-provider'
import { initials, userLabel } from '@/lib/format'
import type { Community } from '@/lib/types'

export function SiteHeader({ communities }: { communities: Community[] }) {
  const { currentUser, createPost } = useInteractions()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-3">
        <MobileNav communities={communities} />

        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="hidden font-heading text-lg font-bold text-foreground sm:block">
            MTU<span className="text-primary">Hub</span>
          </span>
        </Link>

        <SearchBox />

        <div className="flex shrink-0 items-center gap-2">
          {currentUser ? (
            <>
              <CreatePostDialog communities={communities} onCreate={createPost} />

              <Avatar size="sm">
                <AvatarFallback
                  className="bg-primary text-primary-foreground"
                  title={userLabel(currentUser.username)}
                >
                  {initials(currentUser.displayName ?? currentUser.username)}
                </AvatarFallback>
              </Avatar>

              <form action={signOut}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  aria-label="Sign out"
                  className="text-muted-foreground"
                >
                  <LogOut className="size-4" />
                </Button>
              </form>
            </>
          ) : (
            <>
              {/* nativeButton={false} because these render as anchors, not
                  <button> — without it Base UI strips button semantics. */}
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/auth/login" />}
              >
                Log in
              </Button>
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/auth/sign-up" />}
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
