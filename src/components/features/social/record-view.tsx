'use client'

import { useEffect, useRef } from 'react'
import { recordProductViewAction } from '@/app/actions/social'

/** Logs a product page view once on mount (recommendation foundation). */
export function RecordProductView({ productId }: { productId: string }) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    void recordProductViewAction(productId)
  }, [productId])
  return null
}
