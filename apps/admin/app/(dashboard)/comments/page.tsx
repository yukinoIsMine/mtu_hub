import { CommentsTable } from '@/components/comments-table'
import { adminClient } from '@/lib/admin-client'

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; show?: string }>
}) {
  const { q, show } = await searchParams
  const { supabase } = await adminClient()

  let query = supabase
    .from('comments')
    .select(
      `
      id, body, score, created_at, deleted_at,
      posts ( id, title ),
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
    query = query.ilike('body', `%${q.trim()}%`)
  }

  const { data: comments, error } = await query

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Comments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Soft-delete, restore, or permanently purge comments.
        </p>
      </div>
      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search body"
          className="h-8 w-48 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        />
        <select
          name="show"
          defaultValue={show ?? 'active'}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="active">Active</option>
          <option value="deleted">Deleted</option>
          <option value="all">All</option>
        </select>
        <button
          type="submit"
          className="h-8 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          Filter
        </button>
      </form>
      {error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : (
        <CommentsTable comments={(comments as never) ?? []} />
      )}
    </div>
  )
}
