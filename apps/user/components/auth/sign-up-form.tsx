'use client'

import { useActionState } from 'react'

import { signUp, type AuthFormState } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const INITIAL: AuthFormState = { error: null }

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUp, INITIAL)

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label
          htmlFor="displayName"
          className="mb-1 block text-xs font-medium text-muted-foreground"
        >
          Display name <span className="font-normal">(optional)</span>
        </label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          maxLength={60}
          placeholder="Kyaw Min"
        />
      </div>

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
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Your username is generated from your email address. You can change it
        later from your profile.
      </p>
    </form>
  )
}
