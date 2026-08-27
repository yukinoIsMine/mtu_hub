import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'
import { fetchCurrentProfile } from '@/lib/queries'

export default async function LoginPage() {
  if (await fetchCurrentProfile()) redirect('/')

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to post, comment and vote at MTU Hub."
      footer={
        <>
          New here?{' '}
          <Link href="/auth/sign-up" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  )
}
