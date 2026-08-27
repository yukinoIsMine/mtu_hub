import { notFound } from 'next/navigation'

import { PostList } from '@/components/post-list'
import { ProfileDetail } from '@/components/profile-detail'
import { SortBar } from '@/components/sort-bar'
import {
  fetchCommunities,
  fetchPosts,
  fetchProfileByUsername,
} from '@/lib/queries'
import { userLabel } from '@/lib/format'
import { parseSort } from '@/lib/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const profile = await fetchProfileByUsername(username)

  if (!profile) return { title: 'User not found — MTU Hub' }

  const display = profile.displayName?.trim() || profile.username

  return {
    title: `${userLabel(profile.username)} — ${display}`,
    description: profile.bio?.trim() || `Posts by ${userLabel(profile.username)}`,
  }
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>
  searchParams: Promise<{ sort?: string; q?: string }>
}) {
  const [{ username }, { sort: sortParam, q }] = await Promise.all([
    params,
    searchParams,
  ])

  const profile = await fetchProfileByUsername(username)
  if (!profile) notFound()

  const sort = parseSort(sortParam)

  const [communities, posts] = await Promise.all([
    fetchCommunities(),
    fetchPosts({ authorId: profile.id, sort, query: q }),
  ])

  return (
    <ProfileDetail profile={profile} postCount={posts.length}>
      <SortBar />
      <PostList
        posts={posts}
        communities={communities}
        emptyMessage={`${userLabel(profile.username)} hasn’t posted yet.`}
      />
    </ProfileDetail>
  )
}
