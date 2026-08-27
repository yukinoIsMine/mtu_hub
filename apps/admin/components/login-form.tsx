'use client'

import { useActionState } from 'react'

import { Button } from '@mtu/ui/button'
import { Input } from '@mtu/ui/input'
import { Label } from '@mtu/ui/label'

import { signIn, type AuthFormState } from '@/lib/actions/auth'

const initial: AuthFormState = { error: null }

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="admin@mtu.edu.mm"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
