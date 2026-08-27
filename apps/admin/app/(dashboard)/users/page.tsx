import { UsersTable } from '@/components/users-table'
import { adminClient } from '@/lib/admin-client'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const { supabase } = await adminClient()

  let query = supabase
    .from('profiles')
    .select('id, username, display_name, bio, role, disabled_at, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (q?.trim()) {
    const term = `%${q.trim()}%`
    query = query.or(`username.ilike.${term},display_name.ilike.${term}`)
  }

  const { data: users, error } = await query

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search, edit profiles, set roles, and disable accounts.
        </p>
      </div>
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search username or display name"
          className="h-8 w-full max-w-sm rounded-lg border border-input bg-transparent px-2.5 text-sm"
        />
        <button
          type="submit"
          className="h-8 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          Search
        </button>
      </form>
      {error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : (
        <UsersTable users={users ?? []} />
      )}
    </div>
  )
}
