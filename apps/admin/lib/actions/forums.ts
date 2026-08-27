'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import type { Enums } from '@mtu/db'

import { adminClient } from '@/lib/admin-client'
import type { ActionResult } from '@/lib/actions/users'

type Accent = Enums<'community_accent'>

const ACCENTS: Accent[] = [
  'teal',
  'teal_deep',
  'orange',
  'blue',
  'green',
  'navy',
  'emerald',
  'indigo',
]

function parseAccent(value: string): Accent {
  return ACCENTS.includes(value as Accent) ? (value as Accent) : 'teal'
}

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

function parseRules(raw: string): string[] {
  return raw
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean)
}

export async function createForum(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase } = await adminClient()
    const slug = String(formData.get('slug') ?? '').trim()
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const accent = parseAccent(String(formData.get('accent') ?? 'teal'))
    const tags = parseTags(String(formData.get('tags') ?? ''))
    const rules = parseRules(String(formData.get('rules') ?? ''))

    if (!slug || !name) return { error: 'Slug and name are required.' }

    const { data, error } = await supabase
      .from('communities')
      .insert({
        slug,
        name,
        description,
        accent,
        tags,
      })
      .select('id')
      .single()

    if (error) return { error: error.message }

    if (rules.length > 0) {
      const { error: rulesError } = await supabase.from('community_rules').insert(
        rules.map((body, i) => ({
          community_id: data.id,
          position: i + 1,
          body,
        })),
      )
      if (rulesError) return { error: rulesError.message }
    }

    revalidatePath('/forums')
    redirect(`/forums/${data.id}`)
  } catch (e) {
    // redirect() throws; rethrow navigations
    if (e && typeof e === 'object' && 'digest' in e) throw e
    return { error: e instanceof Error ? e.message : 'Create failed.' }
  }
}

export async function updateForum(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase } = await adminClient()
    const id = String(formData.get('id') ?? '')
    const slug = String(formData.get('slug') ?? '').trim()
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const accent = parseAccent(String(formData.get('accent') ?? 'teal'))
    const tags = parseTags(String(formData.get('tags') ?? ''))
    const rules = parseRules(String(formData.get('rules') ?? ''))
    const forumAdminUsernames = parseTags(String(formData.get('moderators') ?? ''))

    if (!id || !slug || !name) return { error: 'Slug and name are required.' }

    const { data: existing } = await supabase
      .from('communities')
      .select('created_by')
      .eq('id', id)
      .maybeSingle()

    let createdBy = existing?.created_by ?? null

    await supabase.from('community_moderators').delete().eq('community_id', id)

    let adminProfiles: { id: string; username: string }[] = []
    if (forumAdminUsernames.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('username', forumAdminUsernames)

      adminProfiles = profiles ?? []

      if (adminProfiles.length > 0) {
        const { error: modError } = await supabase.from('community_moderators').insert(
          adminProfiles.map((p) => ({
            community_id: id,
            profile_id: p.id,
          })),
        )
        if (modError) return { error: modError.message }

        if (!createdBy) {
          const ordered = forumAdminUsernames
            .map((u) => adminProfiles.find((p) => p.username === u))
            .filter((p): p is { id: string; username: string } => Boolean(p))
          createdBy = ordered[0]?.id ?? adminProfiles[0].id
        }
      }
    }

    const { error } = await supabase
      .from('communities')
      .update({ slug, name, description, accent, tags, created_by: createdBy })
      .eq('id', id)

    if (error) return { error: error.message }

    await supabase.from('community_rules').delete().eq('community_id', id)
    if (rules.length > 0) {
      const { error: rulesError } = await supabase.from('community_rules').insert(
        rules.map((body, i) => ({
          community_id: id,
          position: i + 1,
          body,
        })),
      )
      if (rulesError) return { error: rulesError.message }
    }

    revalidatePath('/forums')
    revalidatePath(`/forums/${id}`)
    return { error: null, ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Update failed.' }
  }
}

export async function deleteForum(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await adminClient()

    // Delete dependents that have AFTER DELETE notification triggers first.
    // Cascading those while the community row is mid-delete makes
    // insert_notification fail the FK to communities and aborts the whole delete.
    const { error: modsError } = await supabase
      .from('community_moderators')
      .delete()
      .eq('community_id', id)
    if (modsError) return { error: modsError.message }

    const { error: subsError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('community_id', id)
    if (subsError) return { error: subsError.message }

    const { error: invitesError } = await supabase
      .from('forum_admin_invites')
      .delete()
      .eq('community_id', id)
    if (invitesError) return { error: invitesError.message }

    const { error } = await supabase.from('communities').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/forums')
    redirect('/forums')
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) throw e
    return { error: e instanceof Error ? e.message : 'Delete failed.' }
  }
}
