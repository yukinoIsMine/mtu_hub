import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AuthShell } from '@/components/auth/auth-shell'
import { SignUpForm } from '@/components/auth/sign-up-form'
import { fetchCurrentProfile } from '@/lib/queries'

export default async function SignUpPage() {
  if (await fetchCurrentProfile()) redirect('/')

  return (
    <AuthShell
      title="Join MTU Hub"
      subtitle="Any email address works — you do not need a university one."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  )
}
