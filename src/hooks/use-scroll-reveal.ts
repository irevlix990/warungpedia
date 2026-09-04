'use client'

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'

interface UseScrollRevealOptions {
  threshold?: number
  delay?: number
  once?: boolean
}

interface ScrollRevealReturn {
  ref: RefObject<HTMLDivElement | null>
  style: CSSProperties
}

/**
 * Pure inline-style scroll reveal. No CSS classes, no layers, no specificity issues.
 * Sets initial hidden state via React state, then applies a CSS transition
 * + transforms via inline styles when element enters viewport.
 */
export function useScrollReveal({
  threshold = 0.1,
  delay = 0,
  once = true,
}: UseScrollRevealOptions = {}): ScrollRevealReturn {
  const ref = useRef<HTMLDivElement | null>(null)
  const [revealed, setRevealed] = useState(false)
  const revealedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !revealedRef.current) {
          revealedRef.current = true
          requestAnimationFrame(() => {
            if (delay > 0) {
              setTimeout(() => setRevealed(true), delay)
            } else {
              setRevealed(true)
            }
          })
          if (once) observer.unobserve(el)
        } else if (!entry.isIntersecting && !once) {
          revealedRef.current = false
          setRevealed(false)
        }
      },
      { threshold, rootMargin: '0px 0px -30px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, delay, once])

  const style: CSSProperties = {
    opacity: revealed ? 1 : 0,
    transform: revealed ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: 'transform, opacity',
  }

  return { ref, style }
}
