import { cn } from '@/lib/utils'
import type { Community } from '@/lib/types'

interface CommunityAvatarProps {
  community: Community
  className?: string
}

export function CommunityAvatar({ community, className }: CommunityAvatarProps) {
  const letter = community.slug.replace(/^m\//, '').charAt(0).toUpperCase()
  return (
    <div
      aria-hidden
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold',
        community.colorClass,
        className,
      )}
    >
      {letter}
    </div>
  )
}
