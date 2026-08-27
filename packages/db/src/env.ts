const MISSING_PUBLIC =
  'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and ' +
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see root .env.example).'

const MISSING_SERVICE =
  'Missing SUPABASE_SERVICE_ROLE_KEY. Required for the admin app server. ' +
  'Never expose this key with a NEXT_PUBLIC_ prefix.'

/**
 * Next.js inlines `process.env.NEXT_PUBLIC_*` at build time by literal string
 * replacement — access as direct member expressions only.
 */
export function supabaseEnvOptional() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) return null

  return { url, key }
}

export function supabaseEnv() {
  const env = supabaseEnvOptional()
  if (!env) throw new Error(MISSING_PUBLIC)
  return env
}

export function supabaseServiceEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) throw new Error(MISSING_SERVICE)

  return { url, serviceKey }
}
