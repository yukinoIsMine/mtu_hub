import { ForumForm } from '@/components/forum-form'

export default function NewForumPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">New forum</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a community students can join and post in.
        </p>
      </div>
      <ForumForm
        mode="create"
        values={{
          slug: '',
          name: '',
          description: '',
          accent: 'teal',
          tags: '',
          rules: '',
        }}
      />
    </div>
  )
}
