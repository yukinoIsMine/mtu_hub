'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  writeComment,
  writeCommentVote,
  writePost,
  writePostVote,
  writeSubscription,
} from '@/lib/browser-mutations'
import type { UserState } from '@/lib/queries'
import type { PostFlair, Profile, VoteState } from '@/lib/types'

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

  votePost: (postId: string, next: VoteState) => void
  voteComment: (commentId: string, next: VoteState) => void
  toggleSubscribe: (communityId: string) => void
  createPost: (data: {
    communityId: string
    title: string
    body: string
    flair: string
  }) => Promise<void>
  addComment: (postId: string, body: string, parentId: string | null) => Promise<void>

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
    setPostDeltas({})
    setCommentDeltas({})
  }, [userState])

  const canInteract = Boolean(currentUser)

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
  }) {
    if (!currentUser) return

    try {
      const created = await writePost({
        communityId: data.communityId,
        authorId: currentUser.id,
        title: data.title,
        body: data.body || data.title,
        flair: (data.flair || null) as PostFlair | null,
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
      setError(`Could not publish your post. ${(err as Error).message}`)
    }
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
        votePost,
        voteComment,
        toggleSubscribe,
        createPost,
        addComment,
        error,
        clearError: () => setError(null),
      }}
    >
      {children}
    </InteractionsContext.Provider>
  )
}
