import { Skeleton, Spinner } from '@/components/ui'

export default function LoadingPage() {
  return (
    <div
      className="container-wp flex min-h-[70vh] flex-col items-center justify-center gap-6"
      role="status"
      aria-live="polite"
    >
      <Spinner size="lg" />
      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  )
}
