import { PostList } from '@/components/post-list'
import { SortBar } from '@/components/sort-bar'
import { fetchCommunities, fetchPosts } from '@/lib/queries'
import { parseSort } from '@/lib/types'

export const metadata = {
  title: 'Popular at MTU — MTU Hub',
}

export default async function PopularPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string }>
}) {
  const { sort: sortParam, q } = await searchParams
  const sort = parseSort(sortParam)

  const [communities, posts] = await Promise.all([
    fetchCommunities(),
    fetchPosts({ sort, query: q }),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-bold text-foreground">
          {q ? `Results for “${q}”` : 'Popular at MTU'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {q
            ? `${posts.length} matching ${posts.length === 1 ? 'post' : 'posts'}.`
            : 'The most active discussions across every department.'}
        </p>
      </div>

      <SortBar />
      <PostList posts={posts} communities={communities} />
    </div>
  )
}
