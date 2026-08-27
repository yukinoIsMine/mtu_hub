'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@mtu/ui/button'

import { deleteForum } from '@/lib/actions/forums'

export function ForumDeleteButton({
  id,
  slug,
}: {
  id: string
  slug: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onDelete() {
    if (!confirm(`Permanently delete m/${slug} and all of its posts?`)) return

    setPending(true)
    setError(null)
    try {
      const result = await deleteForum(id)
      if (result?.error) {
        setError(result.error)
        setPending(false)
        return
      }
      router.push('/forums')
      router.refresh()
    } catch (e) {
      // redirect() from the server action throws; treat as success navigation.
      if (e && typeof e === 'object' && 'digest' in e) {
        router.push('/forums')
        router.refresh()
        return
      }
      setError(e instanceof Error ? e.message : 'Delete failed.')
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        size="xs"
        variant="destructive"
        disabled={pending}
        onClick={() => void onDelete()}
      >
        {pending ? 'Deleting…' : 'Delete'}
      </Button>
      {error ? (
        <span className="max-w-[12rem] text-xs text-destructive" title={error}>
          {error}
        </span>
      ) : null}
    </div>
  )
}
