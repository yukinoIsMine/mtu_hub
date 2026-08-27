import { notFound } from 'next/navigation'

import { PostDetail } from '@/components/post-detail'
import {
  fetchCachedPostSummary,
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
  // and the discussion is visible to crawlers. Summary cache is loaded here so
  // re-entering a post does not regenerate or flash “Summarizing…”.
  const [communities, comments, initialSummary] = await Promise.all([
    fetchCommunities(),
    fetchPostComments(post.id),
    fetchCachedPostSummary(post.id),
  ])

  const community = communities.find((c) => c.id === post.communityId)
  if (!community) notFound()

  return (
    <PostDetail
      post={post}
      community={community}
      comments={comments}
      initialSummary={initialSummary}
    />
  )
}
