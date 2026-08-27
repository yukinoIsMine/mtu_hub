'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export interface AuthFormState {
  error: string | null
}

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
  }
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { email, password } = readCredentials(formData)

  if (!email || !password) {
    return { error: 'Enter both your email and password.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Supabase returns the same message for a wrong password and an
    // unconfirmed address, so point at both possibilities.
    return {
      error:
        error.message === 'Invalid login credentials'
          ? 'Wrong email or password — or you have not confirmed your email yet.'
          : error.message,
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { email, password } = readCredentials(formData)
  const displayName = String(formData.get('displayName') ?? '').trim()

  if (!email || !password) {
    return { error: 'Enter both your email and password.' }
  }

  if (password.length < 8) {
    return { error: 'Use a password of at least 8 characters.' }
  }

  const origin = (await headers()).get('origin')
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      // handle_new_user() reads display_name out of raw_user_meta_data when it
      // creates the profile row.
      data: displayName ? { display_name: displayName } : undefined,
    },
  })

  if (error) return { error: error.message }

  redirect('/auth/check-email')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/')
}
