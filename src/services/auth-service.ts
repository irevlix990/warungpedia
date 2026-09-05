/**
 * Server-side authentication service.
 *
 * Wraps Supabase Auth operations that mutate sessions / call the auth API.
 * Identity and authorization checks live in `@/lib/auth/dal`; redirect
 * decisions are made in the Server Actions that call these functions.
 */
import { createClient } from '@/lib/supabase/server'
import { ValidationError } from '@/lib/errors'

/** The URL the google OAuth callback should land the user on. */
function getRedirectUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base}/auth/callback`
}

export async function signUpWithEmail(input: {
  email: string
  password: string
  fullName: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth/callback?next=/`,
    },
  })
  if (error) throw new ValidationError(mapAuthError(error.message))
  return data
}

export async function signInWithEmail(input: {
  email: string
  password: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })
  if (error) throw new ValidationError(mapAuthError(error.message))
  return data
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getRedirectUrl(),
    },
  })
  if (error) throw new ValidationError(mapAuthError(error.message))
  return data
}

export async function sendPasswordReset(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth/update-password`,
  })
  if (error) throw new ValidationError(mapAuthError(error.message))
}

export async function updatePassword(password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw new ValidationError(mapAuthError(error.message))
}

export async function resendVerificationEmail(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth/callback?next=/`,
    },
  })
  if (error) throw new ValidationError(mapAuthError(error.message))
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

/** Normalizes common Supabase auth error messages into friendly text. */
function mapAuthError(message: string): string {
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login credentials')) {
    return 'Email atau kata sandi salah.'
  }
  if (normalized.includes('email not confirmed')) {
    return 'Email Anda belum diverifikasi. Periksa kotak masuk Anda.'
  }
  if (normalized.includes('already registered') || normalized.includes('exists')) {
    return 'Email sudah terdaftar.'
  }
  if (normalized.includes('rate limit')) {
    return 'Terlalu banyak percobaan. Silakan coba lagi nanti.'
  }
  return 'Terjadi kesalahan. Silakan coba lagi.'
}
