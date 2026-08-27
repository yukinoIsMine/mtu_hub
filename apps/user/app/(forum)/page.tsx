import { FeedSections } from '@/components/feed-sections'
import { PostList } from '@/components/post-list'
import { SortBar } from '@/components/sort-bar'
import {
  fetchCommunities,
  fetchCurrentProfile,
  fetchPosts,
  fetchUserState,
} from '@/lib/queries'
import { parseSort } from '@/lib/types'

export const metadata = {
  title: 'Your Home Feed — MTU Hub',
}

const SECTION_LIMIT = 20

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string }>
}) {
  const { sort: sortParam, q } = await searchParams
  const sort = parseSort(sortParam)
  const searching = Boolean(q?.trim())

  const currentUser = await fetchCurrentProfile()
  const [communities, userState] = await Promise.all([
    fetchCommunities(),
    fetchUserState(currentUser?.id ?? null),
  ])

  // With no subscriptions (or signed out) the home feed shows everything,
  // otherwise an empty account would look like a broken site.
  const subscribedIds = userState.subscribedCommunityIds
  const communityIds = subscribedIds.length > 0 ? subscribedIds : undefined

  if (searching) {
    const posts = await fetchPosts({ communityIds, sort, query: q })

    return (
      <div className="space-y-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            Results for “{q}”
          </h1>
          <p className="text-sm text-muted-foreground">
            {posts.length} matching {posts.length === 1 ? 'post' : 'posts'}.
          </p>
        </div>

        <SortBar />
        <PostList
          posts={posts}
          communities={communities}
          emptyMessage={`Nothing matched “${q}”. Try different words.`}
        />
      </div>
    )
  }

  const [latest, top] = await Promise.all([
    fetchPosts({ communityIds, sort: 'new', limit: SECTION_LIMIT }),
    fetchPosts({ communityIds, sort: 'top', limit: SECTION_LIMIT }),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-bold text-foreground">
          Your Home Feed
        </h1>
        <p className="text-sm text-muted-foreground">
          {subscribedIds.length > 0
            ? 'Latest and top posts from communities you follow.'
            : 'Latest and top posts across MTU. Join communities to tailor this feed.'}
        </p>
      </div>

      <FeedSections
        latest={latest}
        top={top}
        communities={communities}
        emptyLatest={
          subscribedIds.length > 0
            ? 'No recent posts in your communities yet.'
            : 'No posts yet.'
        }
        emptyTop={
          subscribedIds.length > 0
            ? 'No top posts in your communities yet.'
            : 'No posts yet.'
        }
      />
    </div>
  )
}
