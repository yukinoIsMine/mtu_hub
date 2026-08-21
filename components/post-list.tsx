import { PostCard } from '@/components/post-card'
import type { Community, Post } from '@/lib/types'

interface PostListProps {
  posts: Post[]
  communities: Community[]
  emptyMessage?: string
}

export function PostList({ posts, communities, emptyMessage }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">
          {emptyMessage ??
            'No posts match this view. Try a different sort, join more communities, or clear your search.'}
        </p>
      </div>
    )
  }

  const communityById = (id: string) => communities.find((c) => c.id === id)

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const community = communityById(post.communityId)
        if (!community) return null

        return <PostCard key={post.id} post={post} community={community} />
      })}
    </div>
  )
}
