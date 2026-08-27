'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createServerSupabaseClient } from '@mtu/db/server'

import { requireAdminProfile } from '@/lib/auth'

export interface AuthFormState {
  error: string | null
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Enter both your email and password.' }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return {
      error:
        error.message === 'Invalid login credentials'
          ? 'Wrong email or password — or email not confirmed.'
          : error.message,
    }
  }

  const admin = await requireAdminProfile()
  if (!admin) {
    await supabase.auth.signOut()
    return { error: 'This account is not an admin.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
