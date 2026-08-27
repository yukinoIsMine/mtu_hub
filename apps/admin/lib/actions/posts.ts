'use server'

import { revalidatePath } from 'next/cache'

import { adminClient } from '@/lib/admin-client'
import type { ActionResult } from '@/lib/actions/users'

const FLAIR_MAX = 40

const POST_IMAGE_BUCKET = 'post-images'

function postImageObjectPath(imageUrl: string): string | null {
  const marker = `/object/public/${POST_IMAGE_BUCKET}/`
  const idx = imageUrl.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(imageUrl.slice(idx + marker.length).split('?')[0] ?? '')
}

async function removeStorageObject(
  supabase: Awaited<ReturnType<typeof adminClient>>['supabase'],
  imageUrl: string | null | undefined,
) {
  if (!imageUrl) return
  const path = postImageObjectPath(imageUrl)
  if (!path) return
  await supabase.storage.from(POST_IMAGE_BUCKET).remove([path])
}

export async function updatePost(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase } = await adminClient()
    const id = String(formData.get('id') ?? '')
    const title = String(formData.get('title') ?? '').trim()
    const flairRaw = String(formData.get('flair') ?? '').trim()
    const flair = flairRaw || null

    if (!id || !title) return { error: 'Title is required.' }
    if (title.length > 140) return { error: 'Title must be 140 characters or fewer.' }
    if (flair && flair.length > FLAIR_MAX) {
      return { error: `Flair must be ${FLAIR_MAX} characters or fewer.` }
    }

    const { error } = await supabase
      .from('posts')
      .update({ title, flair })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/posts')
    return { error: null, ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Update failed.' }
  }
}

export async function softDeletePost(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await adminClient()
    const { error } = await supabase
      .from('posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/posts')
    return { error: null, ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Delete failed.' }
  }
}

export async function restorePost(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await adminClient()
    const { error } = await supabase
      .from('posts')
      .update({ deleted_at: null })
      .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/posts')
    return { error: null, ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Restore failed.' }
  }
}

export async function clearPostImage(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await adminClient()
    const { data, error: fetchError } = await supabase
      .from('posts')
      .select('image_url')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) return { error: fetchError.message }
    if (!data?.image_url) return { error: null, ok: true }

    const { error } = await supabase
      .from('posts')
      .update({ image_url: null, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { error: error.message }

    try {
      await removeStorageObject(supabase, data.image_url)
    } catch {
      /* DB cleared; orphaned file is acceptable */
    }

    revalidatePath('/posts')
    return { error: null, ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Clear image failed.' }
  }
}

export async function hardDeletePost(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await adminClient()

    const { data } = await supabase
      .from('posts')
      .select('image_url')
      .eq('id', id)
      .maybeSingle()

    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) return { error: error.message }

    try {
      await removeStorageObject(supabase, data?.image_url)
    } catch {
      /* row is gone; orphaned file is acceptable */
    }

    revalidatePath('/posts')
    revalidatePath('/comments')
    return { error: null, ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Purge failed.' }
  }
}
