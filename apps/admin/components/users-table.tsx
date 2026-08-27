'use client'

import { useActionState } from 'react'

import { Badge } from '@mtu/ui/badge'
import { Button } from '@mtu/ui/button'
import { Input } from '@mtu/ui/input'

import {
  deleteUser,
  setUserDisabled,
  updateUser,
  type ActionResult,
} from '@/lib/actions/users'

export type UserRow = {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  role: 'user' | 'admin'
  disabled_at: string | null
  created_at: string
}

const initial: ActionResult = { error: null }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function UserRowForm({ user }: { user: UserRow }) {
  const [state, action, pending] = useActionState(updateUser, initial)
  const disabled = Boolean(user.disabled_at)

  return (
    <tr className="border-b border-border last:border-0 align-middle">
      <td className="px-3 py-1.5">
        <form id={`user-${user.id}`} action={action}>
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="bio" value={user.bio ?? ''} />
          <Input
            name="username"
            defaultValue={user.username}
            required
            className="h-7 min-w-[7rem] font-medium"
            aria-label="Username"
          />
        </form>
      </td>
      <td className="px-3 py-1.5">
        <Input
          form={`user-${user.id}`}
          name="display_name"
          defaultValue={user.display_name ?? ''}
          className="h-7 min-w-[8rem]"
          aria-label="Display name"
        />
      </td>
      <td className="px-3 py-1.5">
        <select
          form={`user-${user.id}`}
          name="role"
          defaultValue={user.role}
          className="h-7 rounded-md border border-input bg-transparent px-2 text-sm"
          aria-label="Role"
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </td>
      <td className="px-3 py-1.5">
        {disabled ? (
          <Badge variant="destructive">disabled</Badge>
        ) : (
          <Badge variant="secondary">active</Badge>
        )}
      </td>
      <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground tabular-nums">
        {formatDate(user.created_at)}
      </td>
      <td className="px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <Button form={`user-${user.id}`} type="submit" size="xs" disabled={pending}>
            {pending ? '…' : 'Save'}
          </Button>
          <form
            action={async () => {
              await setUserDisabled(user.id, !disabled)
            }}
          >
            <Button
              type="submit"
              size="xs"
              variant={disabled ? 'secondary' : 'outline'}
            >
              {disabled ? 'Enable' : 'Disable'}
            </Button>
          </form>
          <form
            action={async () => {
              if (
                confirm(
                  `Permanently delete @${user.username}? Their posts/comments keep a null author.`,
                )
              ) {
                await deleteUser(user.id)
              }
            }}
          >
            <Button type="submit" size="xs" variant="destructive">
              Delete
            </Button>
          </form>
          {state.error ? (
            <span className="max-w-[8rem] truncate text-xs text-destructive" title={state.error}>
              {state.error}
            </span>
          ) : state.ok ? (
            <span className="text-xs text-success">Saved</span>
          ) : null}
        </div>
      </td>
    </tr>
  )
}

export function UsersTable({ users }: { users: UserRow[] }) {
  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">No users found.</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Username</th>
            <th className="px-3 py-2 font-medium">Display name</th>
            <th className="px-3 py-2 font-medium">Role</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Joined</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRowForm key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
