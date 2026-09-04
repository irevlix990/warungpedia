'use client'

import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner'
import { useTheme } from './theme-provider'

/**
 * Sonner toast wrapper that respects the current Warungpedia theme.
 * Renders inside RootProviders so it's available app-wide.
 */
export function ToasterProvider() {
  const { resolvedTheme } = useTheme()

  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      theme={resolvedTheme ?? 'light'}
      toastOptions={{
        classNames: {
          toast: 'font-sans text-sm shadow-card',
          title: 'font-semibold',
          description: 'text-neutral-500',
          success: 'border-success-600/20',
          error: 'border-danger-600/20',
        },
      }}
    />
  )
}

/**
 * Convenience hooks / helpers for triggering toasts from any component.
 *
 * Usage:
 *   import { toast } from '@/components/providers/toast-provider'
 *   toast.success('Produk berhasil ditambahkan!')
 *   toast.error('Gagal menyimpan data.')
 */
export const toast = {
  success: (message: string, description?: string) =>
    sonnerToast.success(message, description ? { description } : undefined),
  error: (message: string, description?: string) =>
    sonnerToast.error(message, description ? { description } : undefined),
  info: (message: string, description?: string) =>
    sonnerToast.info(message, description ? { description } : undefined),
  warning: (message: string, description?: string) =>
    sonnerToast.warning(message, description ? { description } : undefined),
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
}
