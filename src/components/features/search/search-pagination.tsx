'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { DictionarySearch } from '../auth/action-strings'

interface SearchPaginationProps {
  baseUrl: string
  page: number
  totalPages: number
  t: DictionarySearch
}

export function SearchPagination({
  baseUrl,
  page,
  totalPages,
  t,
}: SearchPaginationProps) {
  const router = useRouter()

  const go = (p: number) => {
    const url = new URL(baseUrl, window.location.origin)
    const params = new URLSearchParams(url.search)
    if (p > 1) params.set('page', String(p))
    else params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-center gap-3"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
      >
        {t.prevPage}
      </Button>
      <span className="text-sm text-neutral-600 dark:text-neutral-300">
        {t.pageOf
          .replace('{page}', String(page))
          .replace('{total}', String(totalPages))}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => go(page + 1)}
      >
        {t.nextPage}
      </Button>
    </nav>
  )
}
