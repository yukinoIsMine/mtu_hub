'use client'

import { ArrowBigDown, ArrowBigUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatCount } from '@/lib/format'
import type { VoteState } from '@/lib/types'

interface VoteControlProps {
  score: number
  vote: VoteState
  onVote: (next: VoteState) => void
  /** False when signed out — voting requires a session under RLS. */
  disabled?: boolean
  orientation?: 'vertical' | 'horizontal'
  size?: 'sm' | 'md'
}

export function VoteControl({
  score,
  vote,
  onVote,
  disabled = false,
  orientation = 'vertical',
  size = 'md',
}: VoteControlProps) {
  const iconSize = size === 'sm' ? 'size-4' : 'size-5'

  // `score` is displayed as given. It comes from the database, where the total
  // already includes this user's own vote, so adjusting it here again would
  // double-count. The caller applies the delta optimistically when voting.

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 rounded-full bg-secondary p-0.5',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
      )}
    >
      <button
        type="button"
        aria-label="Upvote"
        aria-pressed={vote === 1}
        disabled={disabled}
        title={disabled ? 'Sign in to vote' : undefined}
        onClick={() => onVote(vote === 1 ? 0 : 1)}
        className={cn(
          'flex items-center justify-center rounded-full p-1 transition-colors',
          disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-upvote/15',
          vote === 1 ? 'text-upvote' : 'text-muted-foreground',
        )}
      >
        <ArrowBigUp className={cn(iconSize, vote === 1 && 'fill-upvote')} />
      </button>
      <span
        className={cn(
          'min-w-8 text-center text-xs font-semibold tabular-nums',
          vote === 1 && 'text-upvote',
          vote === -1 && 'text-downvote',
          vote === 0 && 'text-foreground',
        )}
      >
        {formatCount(score)}
      </span>
      <button
        type="button"
        aria-label="Downvote"
        aria-pressed={vote === -1}
        disabled={disabled}
        title={disabled ? 'Sign in to vote' : undefined}
        onClick={() => onVote(vote === -1 ? 0 : -1)}
        className={cn(
          'flex items-center justify-center rounded-full p-1 transition-colors',
          disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-downvote/15',
          vote === -1 ? 'text-downvote' : 'text-muted-foreground',
        )}
      >
        <ArrowBigDown className={cn(iconSize, vote === -1 && 'fill-downvote')} />
      </button>
    </div>
  )
}
