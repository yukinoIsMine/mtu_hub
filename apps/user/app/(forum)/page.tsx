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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string }>
}) {
  const { sort: sortParam, q } = await searchParams
  const searching = Boolean(q?.trim())
  const sort = searching ? parseSort(sortParam) : 'new'

  const currentUser = await fetchCurrentProfile()
  const [communities, userState] = await Promise.all([
    fetchCommunities(),
    fetchUserState(currentUser?.id ?? null),
  ])

  // With no subscriptions (or signed out) the home feed shows everything,
  // otherwise an empty account would look like a broken site.
  const subscribedIds = userState.subscribedCommunityIds
  const posts = await fetchPosts({
    communityIds: subscribedIds.length > 0 ? subscribedIds : undefined,
    sort,
    query: q,
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-bold text-foreground">
          {searching ? `Results for “${q}”` : 'Your Home Feed'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {searching
            ? `${posts.length} matching ${posts.length === 1 ? 'post' : 'posts'}.`
            : subscribedIds.length > 0
              ? 'Latest posts from communities you follow.'
              : 'Latest posts across MTU. Join communities to tailor this feed.'}
        </p>
      </div>

      {searching ? <SortBar /> : null}
      <PostList
        posts={posts}
        communities={communities}
        emptyMessage={
          searching
            ? `Nothing matched “${q}”. Try different words.`
            : subscribedIds.length > 0
              ? 'No recent posts in your communities yet.'
              : 'No posts yet.'
        }
      />
    </div>
  )
}
