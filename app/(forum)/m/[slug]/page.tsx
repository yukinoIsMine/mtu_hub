import { notFound } from 'next/navigation'

import { CommunityDetail } from '@/components/community-detail'
import { PostList } from '@/components/post-list'
import { SortBar } from '@/components/sort-bar'
import { fetchCommunities, fetchCommunityBySlug, fetchPosts } from '@/lib/queries'
import { communityLabel } from '@/lib/format'
import { parseSort } from '@/lib/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const community = await fetchCommunityBySlug(slug)

  if (!community) return { title: 'Community not found — MTU Hub' }

  return {
    title: `${communityLabel(community.slug)} — ${community.name}`,
    description: community.description,
  }
}

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string; q?: string }>
}) {
  const [{ slug }, { sort: sortParam, q }] = await Promise.all([
    params,
    searchParams,
  ])

  const community = await fetchCommunityBySlug(slug)
  if (!community) notFound()

  const sort = parseSort(sortParam)

  const [communities, posts] = await Promise.all([
    fetchCommunities(),
    fetchPosts({ communityId: community.id, sort, query: q }),
  ])

  return (
    <CommunityDetail community={community} postCount={posts.length}>
      <SortBar />
      <PostList
        posts={posts}
        communities={communities}
        emptyMessage={`No posts in ${communityLabel(community.slug)} yet.`}
      />
    </CommunityDetail>
  )
}
