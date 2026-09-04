'use client'

import type { ReactNode } from 'react'
import { ThemeProvider } from './theme-provider'
import { ToasterProvider } from './toast-provider'
import { ServiceWorkerRegister } from '../pwa/service-worker-register'

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
      </ThemeProvider>
      <ServiceWorkerRegister />
    </>
  )
}
