'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  acceptForumAdminInvite,
  declineForumAdminInvite,
  markAllNotificationsRead,
  markNotificationRead,
  softDeleteComment,
  softDeletePost,
  updatePostImage,
  writeComment,
  writeCommentVote,
  writeCommunity,
  writePost,
  writePostVote,
  writeSubscription,
} from '@/lib/browser-mutations'
import type { UserState } from '@/lib/queries'
import type {
  ForumAdminInvite,
  Notification,
  Profile,
  VoteState,
} from '@/lib/types'
import type { CommunityAccent } from '@/lib/accent'

/**
 * Owns everything the user can change: votes, subscriptions, and the optimistic
 * score overlays that go with them.
 *
 * Pages are Server Components, so this sits above them and survives navigation.
 * Scores arrive from the server already including the user's own vote; the
 * overlay here holds only the delta from an in-flight or just-made change.
 */

interface InteractionsValue {
  currentUser: Profile | null
  canInteract: boolean

  postVote: (postId: string) => VoteState
  commentVote: (commentId: string) => VoteState
  postScore: (postId: string, serverScore: number) => number
  commentScore: (commentId: string, serverScore: number) => number
  isSubscribed: (communityId: string) => boolean
  isForumAdmin: (communityId: string) => boolean
  pendingForumAdminInvites: ForumAdminInvite[]
  notifications: Notification[]
  unreadNotificationCount: number

  votePost: (postId: string, next: VoteState) => void
  voteComment: (commentId: string, next: VoteState) => void
  toggleSubscribe: (communityId: string) => void
  createPost: (data: {
    communityId: string
    title: string
    body: string
    flair: string
    image?: File | null
  }) => Promise<void>
  createCommunity: (data: {
    slug: string
    name: string
    description: string
    accent: CommunityAccent
    tags: string[]
    rules: string[]
  }) => Promise<void>
  addComment: (postId: string, body: string, parentId: string | null) => Promise<void>
  removePost: (postId: string) => Promise<void>
  removeComment: (commentId: string) => Promise<void>
  setPostImage: (
    postId: string,
    file: File | null,
    previousUrl: string | null,
  ) => Promise<string | null>
  acceptInvite: (inviteId: string) => Promise<void>
  declineInvite: (inviteId: string) => Promise<void>
  markRead: (notificationId: string) => Promise<void>
  markAllRead: () => Promise<void>

  error: string | null
  clearError: () => void
}

const InteractionsContext = createContext<InteractionsValue | null>(null)

export function useInteractions(): InteractionsValue {
  const value = useContext(InteractionsContext)

  if (!value) {
    throw new Error('useInteractions must be used inside <InteractionsProvider>')
  }

  return value
}

interface ProviderProps {
  currentUser: Profile | null
  userState: UserState
  children: React.ReactNode
}

export function InteractionsProvider({
  currentUser,
  userState,
  children,
}: ProviderProps) {
  const router = useRouter()

  const [postVotes, setPostVotes] = useState(userState.postVotes)
  const [commentVotes, setCommentVotes] = useState(userState.commentVotes)
  const [subscribed, setSubscribed] = useState(
    () => new Set(userState.subscribedCommunityIds),
  )
  const [forumAdminIds, setForumAdminIds] = useState(
    () => new Set(userState.forumAdminCommunityIds),
  )
  const [pendingInvites, setPendingInvites] = useState(
    userState.pendingForumAdminInvites,
  )
  const [notifications, setNotifications] = useState(userState.notifications)

  const [postDeltas, setPostDeltas] = useState<Record<string, number>>({})
  const [commentDeltas, setCommentDeltas] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)

  // When the server re-renders (router.refresh, or navigation), the scores it
  // sends already include every persisted vote. Re-syncing and dropping the
  // overlays here is what stops those votes being counted twice.
  useEffect(() => {
    setPostVotes(userState.postVotes)
    setCommentVotes(userState.commentVotes)
    setSubscribed(new Set(userState.subscribedCommunityIds))
    setForumAdminIds(new Set(userState.forumAdminCommunityIds))
    setPendingInvites(userState.pendingForumAdminInvites)
    setNotifications(userState.notifications)
    setPostDeltas({})
    setCommentDeltas({})
  }, [userState])

  const canInteract = Boolean(currentUser)
  const unreadNotificationCount = notifications.filter((n) => n.readAt == null).length

  const postVote = useCallback(
    (postId: string) => postVotes[postId] ?? 0,
    [postVotes],
  )
  const commentVote = useCallback(
    (commentId: string) => commentVotes[commentId] ?? 0,
    [commentVotes],
  )
  const postScore = useCallback(
    (postId: string, serverScore: number) => serverScore + (postDeltas[postId] ?? 0),
    [postDeltas],
  )
  const commentScore = useCallback(
    (commentId: string, serverScore: number) =>
      serverScore + (commentDeltas[commentId] ?? 0),
    [commentDeltas],
  )
  const isSubscribed = useCallback(
    (communityId: string) => subscribed.has(communityId),
    [subscribed],
  )
  const isForumAdmin = useCallback(
    (communityId: string) => forumAdminIds.has(communityId),
    [forumAdminIds],
  )

  async function votePost(postId: string, next: VoteState) {
    if (!currentUser) return

    const previous = postVotes[postId] ?? 0
    if (previous === next) return

    const delta = next - previous

    setPostVotes((prev) => ({ ...prev, [postId]: next }))
    setPostDeltas((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + delta }))

    try {
      await writePostVote(postId, currentUser.id, next)
    } catch (err) {
      setPostVotes((prev) => ({ ...prev, [postId]: previous }))
      setPostDeltas((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) - delta }))
      setError(`Could not save your vote. ${(err as Error).message}`)
    }
  }

  async function voteComment(commentId: string, next: VoteState) {
    if (!currentUser) return

    const previous = commentVotes[commentId] ?? 0
    if (previous === next) return

    const delta = next - previous

    setCommentVotes((prev) => ({ ...prev, [commentId]: next }))
    setCommentDeltas((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] ?? 0) + delta,
    }))

    try {
      await writeCommentVote(commentId, currentUser.id, next)
    } catch (err) {
      setCommentVotes((prev) => ({ ...prev, [commentId]: previous }))
      setCommentDeltas((prev) => ({
        ...prev,
        [commentId]: (prev[commentId] ?? 0) - delta,
      }))
      setError(`Could not save your vote. ${(err as Error).message}`)
    }
  }

  async function toggleSubscribe(communityId: string) {
    if (!currentUser) return

    const wasSubscribed = subscribed.has(communityId)

    setSubscribed((prev) => {
      const next = new Set(prev)
      if (wasSubscribed) next.delete(communityId)
      else next.add(communityId)
      return next
    })

    try {
      await writeSubscription(communityId, currentUser.id, !wasSubscribed)
      // Picks up the trigger-updated member_count, and re-filters the home feed.
      router.refresh()
    } catch (err) {
      setSubscribed((prev) => {
        const next = new Set(prev)
        if (wasSubscribed) next.add(communityId)
        else next.delete(communityId)
        return next
      })
      setError(`Could not update your membership. ${(err as Error).message}`)
    }
  }

  async function createPost(data: {
    communityId: string
    title: string
    body: string
    flair: string
    image?: File | null
  }) {
    if (!currentUser) throw new Error('Sign in to post.')
    if (!subscribed.has(data.communityId)) {
      throw new Error('You can only post in communities you have joined.')
    }

    try {
      const created = await writePost({
        communityId: data.communityId,
        authorId: currentUser.id,
        title: data.title,
        body: data.body || data.title,
        flair: data.flair.trim() || null,
        image: data.image ?? null,
      })

      // Authors start their own post at +1. Not worth failing the post over.
      try {
        await writePostVote(created.id, currentUser.id, 1)
      } catch {
        /* post stands at 0; the author can upvote it manually */
      }

      router.push(`/post/${created.id}`)
      router.refresh()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not publish your post.'
      setError(`Could not publish your post. ${message}`)
      throw err instanceof Error ? err : new Error(message)
    }
  }

  async function setPostImage(
    postId: string,
    file: File | null,
    previousUrl: string | null,
  ): Promise<string | null> {
    if (!currentUser) throw new Error('Sign in to change the image.')

    try {
      const url = await updatePostImage(postId, file, previousUrl)
      router.refresh()
      return url
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not update the image.'
      setError(`Could not update the image. ${message}`)
      throw err instanceof Error ? err : new Error(message)
    }
  }

  async function createCommunity(data: {
    slug: string
    name: string
    description: string
    accent: CommunityAccent
    tags: string[]
    rules: string[]
  }) {
    if (!currentUser) throw new Error('Sign in to create a forum.')

    const created = await writeCommunity({
      ...data,
      creatorProfileId: currentUser.id,
    })

    setSubscribed((prev) => {
      const next = new Set(prev)
      next.add(created.id)
      return next
    })
    setForumAdminIds((prev) => {
      const next = new Set(prev)
      next.add(created.id)
      return next
    })

    router.push(`/m/${created.slug}`)
    router.refresh()
  }

  async function addComment(
    postId: string,
    body: string,
    parentId: string | null,
  ) {
    if (!currentUser) return

    try {
      await writeComment({ postId, parentId, authorId: currentUser.id, body })
      // Comments are server-rendered, so refresh rather than patching locally.
      router.refresh()
    } catch (err) {
      setError(`Could not post your comment. ${(err as Error).message}`)
    }
  }

  async function removePost(postId: string) {
    try {
      await softDeletePost(postId)
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(`Could not remove post. ${(err as Error).message}`)
      throw err
    }
  }

  async function removeComment(commentId: string) {
    try {
      await softDeleteComment(commentId)
      router.refresh()
    } catch (err) {
      setError(`Could not remove comment. ${(err as Error).message}`)
      throw err
    }
  }

  async function markRead(notificationId: string) {
    const previous = notifications
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId && n.readAt == null
          ? { ...n, readAt: Date.now() }
          : n,
      ),
    )

    try {
      await markNotificationRead(notificationId)
    } catch (err) {
      setNotifications(previous)
      setError(`Could not mark notification as read. ${(err as Error).message}`)
    }
  }

  async function markAllRead() {
    const previous = notifications
    const now = Date.now()
    setNotifications((prev) =>
      prev.map((n) => (n.readAt == null ? { ...n, readAt: now } : n)),
    )

    try {
      await markAllNotificationsRead()
    } catch (err) {
      setNotifications(previous)
      setError(`Could not mark notifications as read. ${(err as Error).message}`)
    }
  }

  async function acceptInvite(inviteId: string) {
    const invite = pendingInvites.find((i) => i.id === inviteId)
    try {
      await acceptForumAdminInvite(inviteId)
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId))
      if (invite) {
        setForumAdminIds((prev) => {
          const next = new Set(prev)
          next.add(invite.communityId)
          return next
        })
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.inviteId === inviteId && n.readAt == null
            ? { ...n, readAt: Date.now() }
            : n,
        ),
      )
      const inviteNotif = notifications.find(
        (n) => n.inviteId === inviteId && n.type === 'forum_admin_invite',
      )
      if (inviteNotif) {
        try {
          await markNotificationRead(inviteNotif.id)
        } catch {
          /* invite already accepted; unread badge will clear on refresh */
        }
      }
      router.refresh()
    } catch (err) {
      setError(`Could not accept invite. ${(err as Error).message}`)
    }
  }

  async function declineInvite(inviteId: string) {
    try {
      await declineForumAdminInvite(inviteId)
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId))
      setNotifications((prev) =>
        prev.map((n) =>
          n.inviteId === inviteId && n.readAt == null
            ? { ...n, readAt: Date.now() }
            : n,
        ),
      )
      const inviteNotif = notifications.find(
        (n) => n.inviteId === inviteId && n.type === 'forum_admin_invite',
      )
      if (inviteNotif) {
        try {
          await markNotificationRead(inviteNotif.id)
        } catch {
          /* invite already declined; unread badge will clear on refresh */
        }
      }
      router.refresh()
    } catch (err) {
      setError(`Could not decline invite. ${(err as Error).message}`)
    }
  }

  return (
    <InteractionsContext.Provider
      value={{
        currentUser,
        canInteract,
        postVote,
        commentVote,
        postScore,
        commentScore,
        isSubscribed,
        isForumAdmin,
        pendingForumAdminInvites: pendingInvites,
        notifications,
        unreadNotificationCount,
        votePost,
        voteComment,
        toggleSubscribe,
        createPost,
        createCommunity,
        addComment,
        removePost,
        removeComment,
        setPostImage,
        acceptInvite,
        declineInvite,
        markRead,
        markAllRead,
        error,
        clearError: () => setError(null),
      }}
    >
      {children}
    </InteractionsContext.Provider>
  )
}
