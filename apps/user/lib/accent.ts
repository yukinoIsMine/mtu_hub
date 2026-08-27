/**
 * Maps a community's stored accent token to Tailwind classes.
 *
 * The database stores a semantic token (`orange`, `navy`) rather than a class
 * string, so renaming a CSS variable is a change here and not a data migration.
 * The values below reproduce the original colours from lib/mock-data.ts exactly.
 */

export type CommunityAccent =
  | 'teal'
  | 'teal_deep'
  | 'orange'
  | 'blue'
  | 'green'
  | 'navy'
  | 'emerald'
  | 'indigo'

const ACCENT_CLASSES: Record<CommunityAccent, string> = {
  teal: 'bg-primary text-primary-foreground',
  teal_deep: 'bg-chart-1 text-primary-foreground',
  orange: 'bg-chart-2 text-white',
  blue: 'bg-chart-3 text-white',
  green: 'bg-chart-4 text-white',
  navy: 'bg-chart-5 text-white',
  emerald: 'bg-success text-white',
  indigo: 'bg-downvote text-white',
}

export function accentClass(accent: CommunityAccent | null | undefined): string {
  if (!accent) return ACCENT_CLASSES.teal

  return ACCENT_CLASSES[accent] ?? ACCENT_CLASSES.teal
}
