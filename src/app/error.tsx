'use client'

import { useEffect } from 'react'
import { ErrorState } from '@/components/ui'

export default function RootErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    // Log technical details server-side/monitoring. Never shown to users.
    console.error(error)
  }, [error])

  return (
    <div className="container-wp flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-lg">
        <ErrorState
          title="Terjadi kendala"
          description="Maaf, terjadi masalah tak terduga. Silakan coba lagi."
          retry={retry}
        />
      </div>
    </div>
  )
}
