'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  sendPasswordReset,
  resendVerificationEmail,
} from '@/services/auth-service'
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
} from '@/lib/validation/auth'
import { requireUserOrThrow } from '@/lib/auth/dal'
import { signOut as signOutService } from '@/services/auth-service'

export interface AuthFormState {
  errors?: Record<string, string[] | undefined>
  message?: string
  success?: boolean
}

export async function signIn(
  _state: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await signInWithEmail(parsed.data)
  } catch (error) {
    return { message: (error as Error).message }
  }

  redirect('/')
}

export async function signUp(
  _state: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    const { user } = await signUpWithEmail({
      email: parsed.data.email,
      password: parsed.data.password,
      fullName: parsed.data.fullName,
    })
    if (user && !user.email_confirmed_at) {
      return {
        success: true,
        message: 'Email verifikasi telah dikirim.',
      }
    }
  } catch (error) {
    return { message: (error as Error).message }
  }

  redirect('/')
}

export async function signInWithGoogleAction(): Promise<void> {
  const { url } = await signInWithGoogle()
  if (url) redirect(url)
}

export async function forgotPassword(
  _state: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await sendPasswordReset(parsed.data.email)
  } catch (error) {
    return { message: (error as Error).message }
  }

  return {
    success: true,
    message: 'Jika email terdaftar, tautan atur ulang telah dikirim.',
  }
}

export async function resendVerification(
  _state: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await resendVerificationEmail(parsed.data.email)
  } catch (error) {
    return { message: (error as Error).message }
  }

  return { success: true, message: 'Email verifikasi telah dikirim ulang.' }
}

export async function signOutAction(): Promise<void> {
  await requireUserOrThrow()
  await signOutService()
  revalidatePath('/', 'layout')
  redirect('/')
}
