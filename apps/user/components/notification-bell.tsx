'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useInteractions } from '@/components/interactions-provider'
import { notificationMessage } from '@/lib/mappers'
import { timeAgo } from '@/lib/format'
import type { Notification } from '@/lib/types'
import { cn } from '@/lib/utils'

function notificationHref(n: Notification): string | null {
  switch (n.type) {
    case 'post_removed':
    case 'comment_removed':
    case 'forum_admin_removed':
    case 'community_kicked':
    case 'forum_admin_invite':
    case 'forum_admin_invite_accepted':
    case 'forum_admin_invite_declined':
      return n.communitySlug ? `/m/${n.communitySlug}` : null
    case 'community_post':
    case 'post_comment':
    case 'comment_reply':
    case 'post_upvote':
    case 'comment_upvote':
      return n.postId ? `/post/${n.postId}` : n.communitySlug ? `/m/${n.communitySlug}` : null
    default:
      return null
  }
}

export function NotificationBell() {
  const router = useRouter()
  const {
    notifications,
    unreadNotificationCount,
    pendingForumAdminInvites,
    markRead,
    markAllRead,
    acceptInvite,
    declineInvite,
  } = useInteractions()

  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const pendingInviteIds = new Set(pendingForumAdminInvites.map((i) => i.id))

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function onItemClick(n: Notification) {
    if (n.readAt == null) {
      void markRead(n.id)
    }

    const href = notificationHref(n)
    if (href) {
      setOpen(false)
      router.push(href)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={
          unreadNotificationCount > 0
            ? `Notifications, ${unreadNotificationCount} unread`
            : 'Notifications'
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative text-muted-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="size-4" />
        {unreadNotificationCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-lg border border-border bg-background shadow-lg max-sm:fixed max-sm:top-14 max-sm:right-3 max-sm:left-3 max-sm:mt-0 max-sm:w-auto"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <p className="text-sm font-medium text-foreground">Notifications</p>
            {unreadNotificationCount > 0 && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => void markAllRead()}
              >
                Mark all as read
              </button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </li>
            ) : (
              notifications.map((n) => {
                const isInvite =
                  n.type === 'forum_admin_invite' &&
                  n.inviteId != null &&
                  pendingInviteIds.has(n.inviteId)

                return (
                  <li
                    key={n.id}
                    className={cn(
                      'border-b border-border last:border-b-0',
                      n.readAt == null ? 'bg-primary/5' : 'bg-background',
                    )}
                  >
                    <button
                      type="button"
                      className="w-full px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                      onClick={() => void onItemClick(n)}
                    >
                      <p className="text-sm text-foreground">
                        {notificationMessage(n)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {timeAgo(n.createdAt)}
                      </p>
                    </button>

                    {isInvite && n.inviteId && (
                      <div className="flex gap-2 px-3 pb-2.5">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            void acceptInvite(n.inviteId!)
                          }}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            void declineInvite(n.inviteId!)
                          }}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
