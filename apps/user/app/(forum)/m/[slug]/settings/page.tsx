import { notFound, redirect } from 'next/navigation'

import { CommunitySettings } from '@/components/community-settings'
import {
  fetchCommunityAdminInvites,
  fetchCommunityBySlug,
  fetchCommunityMembers,
  fetchCurrentProfile,
  fetchForumAdminProfileIds,
  fetchUserState,
} from '@/lib/queries'
import { communityLabel } from '@/lib/format'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const community = await fetchCommunityBySlug(slug)

  if (!community) return { title: 'Community not found — MTU Hub' }

  return {
    title: `Manage ${communityLabel(community.slug)} — MTU Hub`,
  }
}

export default async function CommunitySettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const community = await fetchCommunityBySlug(slug)
  if (!community) notFound()

  const profile = await fetchCurrentProfile()
  if (!profile) redirect('/auth/login')

  const userState = await fetchUserState(profile.id)
  if (!userState.forumAdminCommunityIds.includes(community.id)) {
    redirect(`/m/${community.slug}`)
  }

  const [members, pendingInvites, forumAdmins] = await Promise.all([
    fetchCommunityMembers(community.id),
    fetchCommunityAdminInvites(community.id),
    fetchForumAdminProfileIds(community.id),
  ])

  return (
    <CommunitySettings
      community={community}
      members={members}
      pendingInvites={pendingInvites}
      forumAdmins={forumAdmins}
    />
  )
}
