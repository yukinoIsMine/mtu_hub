'use server'

import { revalidatePath } from 'next/cache'

import { adminClient } from '@/lib/admin-client'
import type { ActionResult } from '@/lib/actions/users'

export async function softDeleteComment(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await adminClient()
    const { error } = await supabase
      .from('comments')
      .update({
        deleted_at: new Date().toISOString(),
        body: '[deleted]',
      })
      .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/comments')
    return { error: null, ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Delete failed.' }
  }
}

export async function restoreComment(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await adminClient()
    const { error } = await supabase
      .from('comments')
      .update({ deleted_at: null })
      .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/comments')
    return { error: null, ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Restore failed.' }
  }
}

export async function hardDeleteComment(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await adminClient()
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/comments')
    revalidatePath('/posts')
    return { error: null, ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Purge failed.' }
  }
}
