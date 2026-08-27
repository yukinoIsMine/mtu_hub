import { notFound } from 'next/navigation'

import { ForumForm } from '@/components/forum-form'
import { adminClient } from '@/lib/admin-client'

export default async function EditForumPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase } = await adminClient()

  const { data: forum } = await supabase
    .from('communities')
    .select(
      `
      id, slug, name, description, accent, tags,
      community_rules ( position, body ),
      community_moderators ( profiles ( username ) )
    `,
    )
    .eq('id', id)
    .maybeSingle()

  if (!forum) notFound()

  const rules = [...(forum.community_rules ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((r) => r.body)
    .join('\n')

  const moderators = (forum.community_moderators ?? [])
    .map((m) => {
      const profile = m.profiles as { username: string } | null
      return profile?.username
    })
    .filter(Boolean)
    .join(', ')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Edit m/{forum.slug}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{forum.name}</p>
      </div>
      <ForumForm
        mode="edit"
        values={{
          id: forum.id,
          slug: forum.slug,
          name: forum.name,
          description: forum.description,
          accent: forum.accent,
          tags: (forum.tags ?? []).join(', '),
          rules,
          moderators,
        }}
      />
    </div>
  )
}
