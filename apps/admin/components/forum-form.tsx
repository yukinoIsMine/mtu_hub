'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@mtu/ui/button'
import { Input } from '@mtu/ui/input'
import { Label } from '@mtu/ui/label'
import { Textarea } from '@mtu/ui/textarea'

import { createForum, updateForum, deleteForum } from '@/lib/actions/forums'
import type { ActionResult } from '@/lib/actions/users'

const ACCENTS = [
  'teal',
  'teal_deep',
  'orange',
  'blue',
  'green',
  'navy',
  'emerald',
  'indigo',
] as const

const initial: ActionResult = { error: null }

type ForumFormValues = {
  id?: string
  slug: string
  name: string
  description: string
  accent: string
  tags: string
  rules: string
  moderators?: string
}

export function ForumForm({
  mode,
  values,
}: {
  mode: 'create' | 'edit'
  values: ForumFormValues
}) {
  const router = useRouter()
  const action = mode === 'create' ? createForum : updateForum
  const [state, formAction, pending] = useActionState(action, initial)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function onDelete() {
    if (!values.id) return
    if (!confirm('Delete this forum and all related data?')) return

    setDeleting(true)
    setDeleteError(null)
    try {
      const result = await deleteForum(values.id)
      if (result?.error) {
        setDeleteError(result.error)
        setDeleting(false)
        return
      }
      router.push('/forums')
      router.refresh()
    } catch (e) {
      if (e && typeof e === 'object' && 'digest' in e) {
        router.push('/forums')
        router.refresh()
        return
      }
      setDeleteError(e instanceof Error ? e.message : 'Delete failed.')
      setDeleting(false)
    }
  }

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" defaultValue={values.slug} required />
        <p className="text-xs text-muted-foreground">Shown as m/Slug — letters and digits only.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={values.name} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={values.description}
          rows={3}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="accent">Accent</Label>
        <select
          id="accent"
          name="accent"
          defaultValue={values.accent}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          {ACCENTS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" name="tags" defaultValue={values.tags} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rules">Rules (one per line)</Label>
        <Textarea id="rules" name="rules" defaultValue={values.rules} rows={5} />
      </div>
      {mode === 'edit' ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="moderators">Forum admins (usernames, comma-separated)</Label>
          <Input
            id="moderators"
            name="moderators"
            defaultValue={values.moderators ?? ''}
          />
          <p className="text-xs text-muted-foreground">
            Platform override — assigns immediately without an invite. The first
            listed user becomes the creator if none is set.
          </p>
        </div>
      ) : null}
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : state.ok ? (
        <p className="text-sm text-success">Saved</p>
      ) : null}
      {deleteError ? (
        <p className="text-sm text-destructive" role="alert">
          {deleteError}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending || deleting}>
          {pending ? 'Saving…' : mode === 'create' ? 'Create forum' : 'Save changes'}
        </Button>
        {mode === 'edit' && values.id ? (
          <Button
            type="button"
            variant="destructive"
            disabled={deleting || pending}
            onClick={() => void onDelete()}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        ) : null}
      </div>
    </form>
  )
}
