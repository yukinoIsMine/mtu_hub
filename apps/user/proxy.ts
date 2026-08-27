import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { supabaseEnvOptional } from '@/lib/supabase/env'

let warnedMissingCredentials = false

/**
 * Refreshes the Supabase auth token on every request and forwards it to both
 * Server Components and the browser.
 *
 * This is the Next.js 16 `proxy` convention — the rename of `middleware`, which
 * is deprecated. The Supabase docs still show the old `middleware.ts` form.
 */
export async function proxy(request: NextRequest) {
  const env = supabaseEnvOptional()

  // This runs on every request, so a hard failure here would take down pages
  // that do not use Supabase at all. Pass through instead — anything that
  // genuinely needs a client still throws when it asks for one.
  if (!env) {
    if (!warnedMissingCredentials) {
      warnedMissingCredentials = true
      console.warn(
        '[supabase] No credentials found — skipping auth session refresh. ' +
          'Copy .env.example to .env.local to enable it.',
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

        // Rebuild the response so the refreshed cookies reach the server render.
        response = NextResponse.next({ request })

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }

        // Stops a CDN or reverse proxy from caching a response that carries auth
        // cookies — without these, one user's session can be served to another.
        for (const [header, headerValue] of Object.entries(headers)) {
          response.headers.set(header, headerValue)
        }
      },
    },
  })

  // Triggers the token refresh. Must run before the response is committed,
  // otherwise a refresh that lands late cannot be written back to cookies.
  await supabase.auth.getClaims()

  // Return this exact object. Constructing a new response here would drop the
  // refreshed cookies and cause intermittent logouts.
  return response
}

export const config = {
  matcher: [
    /*
     * Every path except static assets and image files:
     * _next/static, _next/image, favicon.ico, and common image extensions.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
