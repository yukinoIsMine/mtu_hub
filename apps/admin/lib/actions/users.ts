'use server'

import { revalidatePath } from 'next/cache'

import type { ProfileRole } from '@mtu/db'

import { adminClient } from '@/lib/admin-client'

export type ActionResult = { error: string | null; ok?: boolean }

export async function updateUser(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase } = await adminClient()
    const id = String(formData.get('id') ?? '')
    const username = String(formData.get('username') ?? '').trim()
    const displayName = String(formData.get('display_name') ?? '').trim()
    const bio = String(formData.get('bio') ?? '').trim()
    const role = String(formData.get('role') ?? 'user') as ProfileRole

    if (!id || !username) return { error: 'Username is required.' }
    if (role !== 'user' && role !== 'admin') return { error: 'Invalid role.' }

    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        display_name: displayName || null,
        bio: bio || null,
        role,
      })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/users')
    return { error: null, ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Update failed.' }
  }
}

export async function setUserDisabled(
  id: string,
  disabled: boolean,
): Promise<ActionResult> {
  try {
    const { supabase, profile } = await adminClient()
    if (id === profile.id) return { error: 'You cannot disable your own account.' }

    const { error } = await supabase
      .from('profiles')
      .update({ disabled_at: disabled ? new Date().toISOString() : null })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/users')
    return { error: null, ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Update failed.' }
  }
}

export async function deleteUser(id: string): Promise<ActionResult> {
  try {
    const { supabase, profile } = await adminClient()
    if (id === profile.id) return { error: 'You cannot delete your own account.' }

    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/users')
    return { error: null, ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Delete failed.' }
  }
}
