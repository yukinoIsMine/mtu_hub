'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Clock, Flame, TrendingUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import { parseSort, SORTS, type Sort } from '@/lib/types'

const ICONS: Record<Sort, React.ReactNode> = {
  hot: <Flame className="size-4" />,
  new: <Clock className="size-4" />,
  top: <TrendingUp className="size-4" />,
}

const LABELS: Record<Sort, string> = {
  hot: 'Hot',
  new: 'Latest',
  top: 'Top',
}

/**
 * Sort is a URL parameter, not component state, so a sorted feed can be linked
 * and the back button works. Each value is served by its own index in Postgres.
 */
export function SortBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = parseSort(searchParams.get('sort') ?? undefined)

  function hrefFor(sort: Sort) {
    const params = new URLSearchParams(searchParams.toString())

    // 'new' (Latest) is the default, so leave it out and keep URLs clean.
    if (sort === 'new') params.delete('sort')
    else params.set('sort', sort)

    const queryString = params.toString()
    return queryString ? `${pathname}?${queryString}` : pathname
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1.5">
      {SORTS.map((sort) => (
        <Link
          key={sort}
          href={hrefFor(sort)}
          scroll={false}
          aria-current={active === sort ? 'page' : undefined}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            active === sort
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-secondary',
          )}
        >
          {ICONS[sort]}
          {LABELS[sort]}
        </Link>
      ))}
    </div>
  )
}
