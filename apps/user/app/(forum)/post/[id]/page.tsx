import { notFound } from 'next/navigation'

import { PostDetail } from '@/components/post-detail'
import {
  fetchCommunities,
  fetchPostById,
  fetchPostComments,
} from '@/lib/queries'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = await fetchPostById(id)

  if (!post) return { title: 'Post not found — MTU Hub' }

  return {
    title: `${post.title} — MTU Hub`,
    description: post.body.slice(0, 160),
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const post = await fetchPostById(id)
  if (!post) notFound()

  // Comments are server-rendered, so a shared thread link needs no round trip
  // and the discussion is visible to crawlers.
  const [communities, comments] = await Promise.all([
    fetchCommunities(),
    fetchPostComments(post.id),
  ])

  const community = communities.find((c) => c.id === post.communityId)
  if (!community) notFound()

  return <PostDetail post={post} community={community} comments={comments} />
}
