import Link from 'next/link'

import { ForumDeleteButton } from '@/components/forum-delete-button'
import { adminClient } from '@/lib/admin-client'

export default async function ForumsPage() {
  const { supabase } = await adminClient()
  const { data: forums, error } = await supabase
    .from('communities')
    .select('id, slug, name, member_count, accent, created_at')
    .order('name')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Forums</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and edit communities, rules, and forum admins.
          </p>
        </div>
        <Link
          href="/forums/new"
          className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          New forum
        </Link>
      </div>
      {error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Slug</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Members</th>
                <th className="px-3 py-2 font-medium">Accent</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(forums ?? []).map((forum) => (
                <tr key={forum.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      href={`/forums/${forum.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      m/{forum.slug}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{forum.name}</td>
                  <td className="px-3 py-2 tabular-nums">{forum.member_count}</td>
                  <td className="px-3 py-2">{forum.accent}</td>
                  <td className="px-3 py-2">
                    <ForumDeleteButton id={forum.id} slug={forum.slug} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
