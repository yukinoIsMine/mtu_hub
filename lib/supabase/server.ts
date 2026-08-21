import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from './database.types'
import { supabaseEnv } from './env'

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 *
 * Async, because `cookies()` returns a promise in Next.js 15+. Create a fresh
 * client per request — never share one across requests.
 */
export async function createClient() {
  const cookieStore = await cookies()
  const { url, key } = supabaseEnv()

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Components are not allowed to write cookies. Ignoring this
          // is safe because proxy.ts refreshes the session on every request.
        }
      },
    },
  })
}
