const MISSING_CREDENTIALS =
  'Missing Supabase credentials. Copy .env.example to .env.local and fill in ' +
  'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from ' +
  'your project dashboard (Project Settings → API Keys).'

/**
 * Reads the Supabase credentials, or returns null when they are not configured.
 *
 * Next.js inlines `process.env.NEXT_PUBLIC_*` at build time by literal string
 * replacement, so these must be accessed as direct member expressions — never
 * destructured or looked up dynamically, or they resolve to undefined in the
 * browser bundle.
 */
export function supabaseEnvOptional() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) return null

  return { url, key }
}

/**
 * Same, but throws when unconfigured. Use this wherever Supabase is actually
 * required — code that reaches for a client cannot do anything useful without
 * credentials, so failing loudly beats a cryptic error from deeper in the SDK.
 */
export function supabaseEnv() {
  const env = supabaseEnvOptional()

  if (!env) throw new Error(MISSING_CREDENTIALS)

  return env
}
