export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return `${n}`
}

export function timeAgo(epochMs: number): string {
  const seconds = Math.max(1, Math.floor((Date.now() - epochMs) / 1000))
  const units: [number, string][] = [
    [60, 's'],
    [60, 'm'],
    [24, 'h'],
    [7, 'd'],
    [4.345, 'w'],
    [12, 'mo'],
    [Number.POSITIVE_INFINITY, 'y'],
  ]
  let value = seconds
  let unit = 's'
  for (let i = 0; i < units.length; i++) {
    const [size, label] = units[i]
    if (value < size) {
      unit = label
      break
    }
    value = value / size
    unit = units[i + 1]?.[1] ?? label
  }
  return `${Math.floor(value)}${unit} ago`
}

export function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function initials(name: string): string {
  const clean = name.replace(/^[um]\//, '')
  const parts = clean.split(/[\s_]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return clean.slice(0, 2).toUpperCase()
}
