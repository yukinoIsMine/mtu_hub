import Link from 'next/link'
import { MailCheck } from 'lucide-react'

import { AuthShell } from '@/components/auth/auth-shell'

export default function CheckEmailPage() {
  return (
    <AuthShell
      title="Confirm your email"
      subtitle="Your account exists, but needs one more step."
      footer={
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-3 text-sm">
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-5" />
        </span>

        <p className="leading-relaxed text-foreground/90">
          We sent you a confirmation link. Open it and you will be signed in
          automatically.
        </p>

        <p className="leading-relaxed text-muted-foreground">
          Nothing arrived? Check your spam folder. Confirmation emails are rate
          limited on the free plan, so a burst of signups at once can take a few
          minutes to come through.
        </p>
      </div>
    </AuthShell>
  )
}
