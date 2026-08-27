import { createServerSupabaseClient } from '@mtu/db/server'
import type { ProfileRole } from '@mtu/db'

export type AdminProfile = {
  id: string
  username: string
  display_name: string | null
  role: ProfileRole
  disabled_at: string | null
}

/**
 * Returns the signed-in admin profile, or null if missing / not admin / disabled.
 */
export async function requireAdminProfile(): Promise<AdminProfile | null> {
  const supabase = await createServerSupabaseClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (!userId || typeof userId !== 'string') return null

  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, role, disabled_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return null
  if (data.role !== 'admin') return null
  if (data.disabled_at) return null

  return data as AdminProfile
}
