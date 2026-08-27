import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { supabaseEnvOptional } from '@mtu/db/env'

let warnedMissingCredentials = false

export async function proxy(request: NextRequest) {
  const env = supabaseEnvOptional()

  if (!env) {
    if (!warnedMissingCredentials) {
      warnedMissingCredentials = true
      console.warn(
        '[supabase] No credentials found — skipping auth session refresh.',
      )
    }
    return NextResponse.next({ request })
  }

  const { url, key } = env
  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
        for (const [header, headerValue] of Object.entries(headers)) {
          response.headers.set(header, headerValue)
        }
      },
    },
  })

  await supabase.auth.getClaims()
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
