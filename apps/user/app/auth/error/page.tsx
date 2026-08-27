import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'

import { AuthShell } from '@/components/auth/auth-shell'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams

  return (
    <AuthShell
      title="That link did not work"
      subtitle="Confirmation links expire, and each one can only be used once."
      footer={
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-3 text-sm">
        <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert className="size-5" />
        </span>

        {reason && (
          <p className="rounded-lg bg-secondary p-2.5 font-mono text-xs leading-relaxed text-foreground/90">
            {reason}
          </p>
        )}

        <p className="leading-relaxed text-muted-foreground">
          Try signing in again — if your email is still unconfirmed, signing up
          once more will send a fresh link.
        </p>
      </div>
    </AuthShell>
  )
}
