/**
 * Server-side validation schemas for authentication flows.
 *
 * These schemas run on the server (in Server Actions) and are the single
 * source of truth for accepted input. Passwords/emails are validated here
 * before any call to the auth provider or database.
 */
import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, { message: 'Kata sandi minimal 8 karakter.' })
  .max(72, { message: 'Kata sandi maksimal 72 karakter.' })
  .regex(/[a-zA-Z]/, { message: 'Kata sandi harus mengandung huruf.' })
  .regex(/[0-9]/, { message: 'Kata sandi harus mengandung angka.' })

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .min(2, { message: 'Nama minimal 2 karakter.' })
      .max(100, { message: 'Nama maksimal 100 karakter.' })
      .trim(),
    email: z.string().email({ message: 'Email tidak valid.' }).trim().toLowerCase(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok.',
    path: ['confirmPassword'],
  })

export type SignUpInput = z.infer<typeof signUpSchema>

export const signInSchema = z.object({
  email: z.string().email({ message: 'Email tidak valid.' }).trim().toLowerCase(),
  password: z.string().min(1, { message: 'Kata sandi wajib diisi.' }),
})

export type SignInInput = z.infer<typeof signInSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Email tidak valid.' }).trim().toLowerCase(),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok.',
    path: ['confirmPassword'],
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Nama minimal 2 karakter.' })
    .max(100, { message: 'Nama maksimal 100 karakter.' })
    .trim(),
  phone: z
    .string()
    .max(20, { message: 'Nomor telepon maksimal 20 karakter.' })
    .trim()
    .optional()
    .nullable(),
  preferredLocale: z.enum(['id', 'en']).default('id'),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
