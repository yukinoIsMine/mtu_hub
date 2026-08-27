import { createBrowserClient } from '@supabase/ssr'

import type { Database } from './database.types'
import { supabaseEnv } from './env'

/** Browser / Client Component Supabase client (publishable key + RLS). */
export function createBrowserSupabaseClient() {
  const { url, key } = supabaseEnv()
  return createBrowserClient<Database>(url, key)
}
