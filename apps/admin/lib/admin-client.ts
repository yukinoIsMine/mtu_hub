import { createServiceSupabaseClient } from '@mtu/db/admin'

import { requireAdminProfile } from '@/lib/auth'

/** Service-role client after verifying the caller is an admin. */
export async function adminClient() {
  const profile = await requireAdminProfile()
  if (!profile) {
    throw new Error('Unauthorized')
  }
  return { profile, supabase: createServiceSupabaseClient() }
}
