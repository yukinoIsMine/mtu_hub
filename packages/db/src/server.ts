import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from './database.types'
import { supabaseEnv } from './env'

/**
 * Server Components / Server Actions / Route Handlers client (publishable key).
 * Fresh client per request — never share across requests.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  const { url, key } = supabaseEnv()

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Components cannot write cookies; proxy refreshes the session.
        }
      },
    },
  })
}
