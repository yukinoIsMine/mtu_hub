import Image from 'next/image'
import { redirect } from 'next/navigation'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@mtu/ui/card'

import { LoginForm } from '@/components/login-form'
import { requireAdminProfile } from '@/lib/auth'

export default async function LoginPage() {
  const admin = await requireAdminProfile()
  if (admin) redirect('/')

  return (
    <div className="flex min-h-svh items-center justify-center bg-[radial-gradient(ellipse_at_top,_oklch(0.95_0.03_190),_oklch(0.985_0.004_180))] px-4">
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader>
          <div className="mb-2 flex justify-center">
            <Image
              src="/logo.jpeg"
              alt="MTU Hub"
              width={48}
              height={48}
              className="size-12 rounded-xl object-cover"
              priority
            />
          </div>
          <CardTitle className="text-center">MTU Hub Admin</CardTitle>
          <CardDescription className="text-center">
            Sign in with an admin account to manage users, forums, and posts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
