'use client'

import { useActionState } from 'react'

import { signIn, type AuthFormState } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const INITIAL: AuthFormState = { error: null }

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, INITIAL)

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-xs font-medium text-muted-foreground"
        >
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-xs font-medium text-muted-foreground"
        >
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
