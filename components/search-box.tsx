'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

/**
 * Search is a URL parameter so a result set can be shared and revisited.
 *
 * Typing is debounced before it reaches the URL — every push re-runs the query
 * in Postgres, and one round trip per keystroke is not worth it.
 */
export function SearchBox() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const urlQuery = searchParams.get('q') ?? ''
  const [value, setValue] = useState(urlQuery)

  // Keep the box in step when the URL changes from elsewhere (back button,
  // clicking a community, following a link).
  useEffect(() => {
    setValue(urlQuery)
  }, [urlQuery])

  useEffect(() => {
    if (value === urlQuery) return

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (value.trim()) params.set('q', value.trim())
      else params.delete('q')

      // Searching from a post page should land on the feed, not filter a thread.
      const base = pathname.startsWith('/post/') ? '/' : pathname
      const queryString = params.toString()

      router.push(queryString ? `${base}?${queryString}` : base, { scroll: false })
    }, 400)

    return () => clearTimeout(timer)
  }, [value, urlQuery, pathname, router, searchParams])

  return (
    <div className="relative mx-auto w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search MTU Hub"
        aria-label="Search posts"
        className="h-9 w-full rounded-full border border-input bg-secondary/60 pl-9 pr-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/40"
      />
    </div>
  )
}
