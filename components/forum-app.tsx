'use client'

import { useMemo, useState } from 'react'
import { Flame, Clock, TrendingUp } from 'lucide-react'

import { LeftSidebar } from '@/components/left-sidebar'
import { PostCard } from '@/components/post-card'
import { PostDetail } from '@/components/post-detail'
import { RightSidebar } from '@/components/right-sidebar'
import { SiteHeader } from '@/components/site-header'
import { CommunityDetail } from '@/components/community-detail'
import {
  CURRENT_USER,
  comments as seedComments,
  communities,
  posts as seedPosts,
} from '@/lib/mock-data'
import { recommendPosts } from '@/lib/recommendations'
import { cn } from '@/lib/utils'
import type { Comment, Post, VoteState } from '@/lib/types'

type Sort = 'hot' | 'new' | 'top'
type View = { type: 'feed' } | { type: 'post'; postId: string }

const DEFAULT_SUBSCRIBED = new Set(['c-it', 'c-exams', 'c-campus'])

export function ForumApp() {
  const [posts, setPosts] = useState<Post[]>(seedPosts)
  const [comments, setComments] = useState<Comment[]>(seedComments)
  const [postVotes, setPostVotes] = useState<Record<string, VoteState>>({})
  const [commentVotes, setCommentVotes] = useState<Record<string, VoteState>>({})
  const [subscribed, setSubscribed] = useState<Set<string>>(DEFAULT_SUBSCRIBED)

  const [query, setQuery] = useState('')
  const [feedMode, setFeedMode] = useState<'home' | 'popular'>('home')
  const [sort, setSort] = useState<Sort>('hot')
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null)
  const [view, setView] = useState<View>({ type: 'feed' })

  const communityById = (id: string) => communities.find((c) => c.id === id)!

  const effectiveScore = (post: Post) => {
    const v = postVotes[post.id] ?? 0
    return post.score + v
  }

  const commentCount = (postId: string) =>
    comments.filter((c) => c.postId === postId).length

  // ----- Feed computation -----
  const feedPosts = useMemo(() => {
    let list = [...posts]

    if (activeCommunityId) {
      list = list.filter((p) => p.communityId === activeCommunityId)
    } else if (feedMode === 'home' && subscribed.size > 0) {
      list = list.filter((p) => subscribed.has(p.communityId))
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q) ||
          communityById(p.communityId).slug.toLowerCase().includes(q),
      )
    }

    const now = Date.now()
    list.sort((a, b) => {
      if (sort === 'new') return b.createdAt - a.createdAt
      if (sort === 'top') return effectiveScore(b) - effectiveScore(a)
      // hot: score decayed by age
      const hot = (p: Post) => {
        const ageH = (now - p.createdAt) / (1000 * 60 * 60)
        return effectiveScore(p) - ageH * 4
      }
      return hot(b) - hot(a)
    })

    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, activeCommunityId, feedMode, subscribed, query, sort, postVotes])

  const recommendations = useMemo(
    () => recommendPosts({ posts, communities, votes: postVotes, subscribed }),
    [posts, postVotes, subscribed],
  )

  // ----- Handlers -----
  function votePost(postId: string, next: VoteState) {
    setPostVotes((prev) => ({ ...prev, [postId]: next }))
  }

  function voteComment(commentId: string, next: VoteState) {
    setCommentVotes((prev) => ({ ...prev, [commentId]: next }))
  }

  function toggleSubscribe(id: string) {
    setSubscribed((prev) => {
      const nextSet = new Set(prev)
      if (nextSet.has(id)) nextSet.delete(id)
      else nextSet.add(id)
      return nextSet
    })
  }

  function createPost(data: {
    communityId: string
    title: string
    body: string
    flair: string
  }) {
    const id = `p-${Date.now()}`
    const newPost: Post = {
      id,
      communityId: data.communityId,
      author: CURRENT_USER,
      title: data.title,
      body: data.body || data.title,
      flair: data.flair,
      score: 1,
      commentCount: 0,
      createdAt: Date.now(),
    }
    setPosts((prev) => [newPost, ...prev])
    setPostVotes((prev) => ({ ...prev, [id]: 1 }))
    setActiveCommunityId(null)
    setFeedMode('home')
    setSort('new')
    setView({ type: 'feed' })
  }

  function addComment(postId: string, body: string, parentId: string | null) {
    const id = `cm-${Date.now()}`
    const newComment: Comment = {
      id,
      postId,
      parentId,
      author: CURRENT_USER,
      body,
      score: 1,
      createdAt: Date.now(),
    }
    setComments((prev) => [...prev, newComment])
    setCommentVotes((prev) => ({ ...prev, [id]: 1 }))
  }

  function openPost(postId: string) {
    setView({ type: 'post', postId })
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 })
  }

  function selectCommunity(id: string) {
    setActiveCommunityId(id)
    setView({ type: 'feed' })
  }

  function selectFeed(mode: 'home' | 'popular') {
    setFeedMode(mode)
    setActiveCommunityId(null)
    setView({ type: 'feed' })
  }

  const activeCommunity = activeCommunityId
    ? communityById(activeCommunityId)
    : null

  const activePost =
    view.type === 'post' ? posts.find((p) => p.id === view.postId) : undefined
  const activePostComments =
    view.type === 'post'
      ? comments
          .filter((c) => c.postId === view.postId)
          .sort((a, b) => b.score - a.score)
      : []

  const sortBarNode = <SortBar sort={sort} onSort={setSort} />

  const postsSlot =
    feedPosts.length === 0 ? (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">
          No posts match this view. Try a different sort, join more communities,
          or clear your search.
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {feedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={{ ...post, commentCount: commentCount(post.id) }}
            community={communityById(post.communityId)}
            vote={postVotes[post.id] ?? 0}
            onVote={(next) => votePost(post.id, next)}
            onOpen={() => openPost(post.id)}
            onOpenCommunity={() => selectCommunity(post.communityId)}
          />
        ))}
      </div>
    )

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader
        query={query}
        onQueryChange={setQuery}
        communities={communities}
        currentUser={CURRENT_USER}
        onCreate={createPost}
        onHome={() => selectFeed('home')}
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
        {/* Left sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <LeftSidebar
              communities={communities}
              subscribed={subscribed}
              activeCommunityId={activeCommunityId}
              feedMode={feedMode}
              onSelectFeed={selectFeed}
              onSelectCommunity={selectCommunity}
              onToggleSubscribe={toggleSubscribe}
            />
          </div>
        </div>

        {/* Center column */}
        <main className="min-w-0">
          {view.type === 'post' && activePost ? (
            <PostDetail
              post={activePost}
              community={communityById(activePost.communityId)}
              comments={activePostComments}
              postVote={postVotes[activePost.id] ?? 0}
              commentVotes={commentVotes}
              onVotePost={(next) => votePost(activePost.id, next)}
              onVoteComment={voteComment}
              onAddComment={(body, parentId) =>
                addComment(activePost.id, body, parentId)
              }
              onBack={() => setView({ type: 'feed' })}
              onOpenCommunity={() => selectCommunity(activePost.communityId)}
            />
          ) : activeCommunity ? (
            <CommunityDetail
              community={activeCommunity}
              subscribed={subscribed.has(activeCommunity.id)}
              postCount={feedPosts.length}
              onToggleSubscribe={() => toggleSubscribe(activeCommunity.id)}
              onBack={() => selectFeed('home')}
              sortBar={sortBarNode}
              postsSlot={postsSlot}
            />
          ) : (
            <div className="space-y-4">
              <div>
                <h1 className="font-heading text-xl font-bold text-foreground">
                  {feedMode === 'home' ? 'Your Home Feed' : 'Popular at MTU'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {feedMode === 'home'
                    ? 'Posts from communities you follow.'
                    : 'The most active discussions across every department.'}
                </p>
              </div>

              {sortBarNode}
              {postsSlot}
            </div>
          )}
        </main>

        {/* Right sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <RightSidebar
              recommendations={recommendations}
              communities={communities}
              onOpenPost={openPost}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function SortBar({ sort, onSort }: { sort: Sort; onSort: (s: Sort) => void }) {
  const items: { key: Sort; label: string; icon: React.ReactNode }[] = [
    { key: 'hot', label: 'Hot', icon: <Flame className="size-4" /> },
    { key: 'new', label: 'New', icon: <Clock className="size-4" /> },
    { key: 'top', label: 'Top', icon: <TrendingUp className="size-4" /> },
  ]
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1.5">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSort(item.key)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            sort === item.key
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-secondary',
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  )
}


