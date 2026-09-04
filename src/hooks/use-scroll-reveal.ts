'use client'

import { useEffect, useRef, type RefObject } from 'react'

interface UseScrollRevealOptions {
  threshold?: number
  delay?: number
  once?: boolean
}

interface ScrollRevealReturn {
  ref: RefObject<HTMLDivElement | null>
}

/**
 * Registers an IntersectionObserver on the ref'd element and toggles
 * a CSS class (`is-revealed`) so the browser's compositor handles
 * the actual animation via @keyframes — zero React re-renders per frame.
 *
 * The element must have `wp-reveal wp-reveal-{direction}` classes
 * pre-applied for the initial hidden state to take effect.
 */
export function useScrollReveal({
  threshold = 0.1,
  delay = 0,
  once = true,
}: UseScrollRevealOptions = {}): ScrollRevealReturn {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => el.classList.add('is-revealed'), delay)
          } else {
            el.classList.add('is-revealed')
          }
          if (once) observer.unobserve(el)
        } else if (!once) {
          el.classList.remove('is-revealed')
        }
      },
      { threshold, rootMargin: '0px 0px -30px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, delay, once])

  return { ref }
}
