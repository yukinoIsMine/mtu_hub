'use client'

import { useEffect, useState } from 'react'

import { timeAgo } from '@/lib/format'

/**
 * Relative timestamp that survives hydration.
 *
 * timeAgo() reads Date.now(), so the server and the browser compute it at
 * different instants — for a post a few seconds old that is the difference
 * between "31s ago" and "32s ago", which React reports as a hydration mismatch.
 *
 * The server-rendered value is kept (so the timestamp is present without JS and
 * to crawlers), the one-tick drift is suppressed, and the effect corrects the
 * value on mount and keeps it fresh afterwards.
 */
export function TimeAgo({ at, className }: { at: number; className?: string }) {
  const [label, setLabel] = useState(() => timeAgo(at))

  useEffect(() => {
    setLabel(timeAgo(at))

    const id = setInterval(() => setLabel(timeAgo(at)), 30_000)
    return () => clearInterval(id)
  }, [at])

  return (
    <time
      dateTime={new Date(at).toISOString()}
      className={className}
      suppressHydrationWarning
    >
      {label}
    </time>
  )
}
