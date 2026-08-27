import { FeedSections } from '@/components/feed-sections'
import { PostList } from '@/components/post-list'
import { SortBar } from '@/components/sort-bar'
import { fetchCommunities, fetchPosts } from '@/lib/queries'
import { parseSort } from '@/lib/types'

export const metadata = {
  title: 'Popular at MTU — MTU Hub',
}

const SECTION_LIMIT = 20

export default async function PopularPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string }>
}) {
  const { sort: sortParam, q } = await searchParams
  const sort = parseSort(sortParam)
  const searching = Boolean(q?.trim())

  const communities = await fetchCommunities()

  if (searching) {
    const posts = await fetchPosts({ sort, query: q })

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
    fetchPosts({ sort: 'new', limit: SECTION_LIMIT }),
    fetchPosts({ sort: 'top', limit: SECTION_LIMIT }),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-bold text-foreground">
          Popular at MTU
        </h1>
        <p className="text-sm text-muted-foreground">
          Latest and top discussions across every department.
        </p>
      </div>

      <FeedSections latest={latest} top={top} communities={communities} />
    </div>
  )
}
