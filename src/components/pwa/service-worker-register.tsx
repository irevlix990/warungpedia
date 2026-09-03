'use client'

import { useEffect } from 'react'

/**
 * Registers the app-shell service worker for offline support and faster
 * repeat loads. Only enabled in production builds where the asset hashes are
 * stable; in development the file is served fresh so it is skipped to avoid
 * caching drift while iterating.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    if (!window.isSecureContext) return

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        await registration.update()
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Service worker registration failed.', error)
        }
      }
    }

    void register()
  }, [])

  return null
}
