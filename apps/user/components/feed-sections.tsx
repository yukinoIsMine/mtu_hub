import { PostList } from '@/components/post-list'
import type { Community, Post } from '@/lib/types'

interface FeedSectionsProps {
  latest: Post[]
  top: Post[]
  communities: Community[]
  emptyLatest?: string
  emptyTop?: string
}

/** Home / Popular default view: newest posts and highest-scored posts. */
export function FeedSections({
  latest,
  top,
  communities,
  emptyLatest,
  emptyTop,
}: FeedSectionsProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">
            Latest
          </h2>
          <p className="text-xs text-muted-foreground">Newest posts first</p>
        </div>
        <PostList
          posts={latest}
          communities={communities}
          emptyMessage={emptyLatest ?? 'No posts yet.'}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">
            Top
          </h2>
          <p className="text-xs text-muted-foreground">Highest scored posts</p>
        </div>
        <PostList
          posts={top}
          communities={communities}
          emptyMessage={emptyTop ?? 'No posts yet.'}
        />
      </section>
    </div>
  )
}
