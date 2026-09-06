'use client'

import type { ReactNode } from 'react'
import { ThemeProvider } from './theme-provider'
import { ToasterProvider } from './toast-provider'
import { ServiceWorkerRegister } from '../pwa/service-worker-register'
import { LiveSupportChat } from '@/components/features/chat/live-support-chat'

/**
 * Aggregates client-side providers (theme, toast notifications, and later
 * auth/session, notification, i18n providers) to be mounted once in the root layout.
 */
export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <ThemeProvider>
        {children}
        <ToasterProvider />
        <LiveSupportChat />
      </ThemeProvider>
      <ServiceWorkerRegister />
    </>
  )
}
