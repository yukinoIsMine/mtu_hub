import { Card, CardContent, CardHeader, CardTitle } from '@mtu/ui/card'

import { adminClient } from '@/lib/admin-client'

export default async function OverviewPage() {
  const { supabase } = await adminClient()

  const [users, communities, posts, comments] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('communities').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('comments').select('id', { count: 'exact', head: true }).is('deleted_at', null),
  ])

  const stats = [
    { label: 'Users', value: users.count ?? 0 },
    { label: 'Forums', value: communities.count ?? 0 },
    { label: 'Posts', value: posts.count ?? 0 },
    { label: 'Comments', value: comments.count ?? 0 },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Campus-wide counts for MTU Hub.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-semibold tabular-nums">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
