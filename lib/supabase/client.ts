import { createBrowserClient } from '@supabase/ssr'

import type { Database } from './database.types'
import { supabaseEnv } from './env'

/**
 * Supabase client for Client Components — anything under a 'use client'
 * boundary, which is most of this app. Cookie handling is automatic in the
 * browser, so no cookie methods are configured here.
 *
 * Unlike the server counterpart in ./server.ts, this is synchronous.
 */
export function createClient() {
  const { url, key } = supabaseEnv()

  return createBrowserClient<Database>(url, key)
}
