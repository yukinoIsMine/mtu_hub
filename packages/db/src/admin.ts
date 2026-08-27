import { createClient } from '@supabase/supabase-js'

import type { Database } from './database.types'
import { supabaseServiceEnv } from './env'

/**
 * Service-role client — bypasses RLS. Server-only. Never import from Client Components.
 */
export function createServiceSupabaseClient() {
  const { url, serviceKey } = supabaseServiceEnv()

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
