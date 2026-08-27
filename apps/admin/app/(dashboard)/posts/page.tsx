import { PostsTable } from '@/components/posts-table'
import { adminClient } from '@/lib/admin-client'

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; community?: string; show?: string }>
}) {
  const { q, community, show } = await searchParams
  const { supabase } = await adminClient()

  let query = supabase
    .from('posts')
    .select(
      `
      id, title, flair, image_url, score, comment_count, created_at, deleted_at,
      communities ( slug, name ),
      profiles:author_id ( username )
    `,
    )
    .order('created_at', { ascending: false })
    .limit(50)

  if (show !== 'all' && show !== 'deleted') {
    query = query.is('deleted_at', null)
  } else if (show === 'deleted') {
    query = query.not('deleted_at', 'is', null)
  }

  if (q?.trim()) {
    query = query.ilike('title', `%${q.trim()}%`)
  }

  if (community?.trim()) {
    const { data: communityRow } = await supabase
      .from('communities')
      .select('id')
      .ilike('slug', community.trim())
      .maybeSingle()
    if (communityRow) {
      query = query.eq('community_id', communityRow.id)
    }
  }

  const { data: posts, error } = await query
  const { data: communities } = await supabase
    .from('communities')
    .select('slug, name')
    .order('slug')

  const status = show ?? 'active'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Posts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review posts, edit titles and flair, manage images, and soft-delete or purge.
        </p>
      </div>

      <form className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
            <label htmlFor="posts-q" className="text-xs font-medium text-muted-foreground">
              Search
            </label>
            <input
              id="posts-q"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Search by title…"
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="posts-community"
              className="text-xs font-medium text-muted-foreground"
            >
              Forum
            </label>
            <select
              id="posts-community"
              name="community"
              defaultValue={community ?? ''}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">All forums</option>
              {(communities ?? []).map((c) => (
                <option key={c.slug} value={c.slug}>
                  m/{c.slug} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="posts-show"
              className="text-xs font-medium text-muted-foreground"
            >
              Status
            </label>
            <select
              id="posts-show"
              name="show"
              defaultValue={status}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="active">Active</option>
              <option value="deleted">Deleted</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="h-9 w-full rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Apply filters
            </button>
          </div>
        </div>
      </form>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error.message}
        </p>
      ) : (
        <PostsTable posts={(posts as never) ?? []} />
      )}
    </div>
  )
}
