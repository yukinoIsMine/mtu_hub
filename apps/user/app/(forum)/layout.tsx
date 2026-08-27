import { AppShell } from '@/components/app-shell'
import { InteractionsProvider } from '@/components/interactions-provider'
import {
  fetchCommunities,
  fetchCurrentProfile,
  fetchPosts,
  fetchUserState,
} from '@/lib/queries'
import { recommendPosts } from '@/lib/recommendations'

export default async function ForumLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Profile first: votes and subscriptions are keyed by profile id.
  const currentUser = await fetchCurrentProfile()

  const [communities, userState, topPosts] = await Promise.all([
    fetchCommunities(),
    fetchUserState(currentUser?.id ?? null),
    // Ordered by score, so this doubles as the trending list.
    fetchPosts({ sort: 'top', limit: 100 }),
  ])

  const recommendations = recommendPosts({
    posts: topPosts,
    communities,
    votes: userState.postVotes,
    subscribed: new Set(userState.subscribedCommunityIds),
  })

  return (
    <InteractionsProvider currentUser={currentUser} userState={userState}>
      <AppShell
        communities={communities}
        recommendations={recommendations}
        trending={topPosts.slice(0, 5)}
      >
        {children}
      </AppShell>
    </InteractionsProvider>
  )
}
