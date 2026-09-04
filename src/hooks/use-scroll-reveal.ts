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
 * Ultra-smooth scroll reveal using pure inline styles.
 *
 * Key techniques for buttery smoothness:
 * 1. Double requestAnimationFrame — ensures browser paints hidden state
 *    BEFORE the transition begins (eliminates any flash/jank).
 * 2. translate3d() — forces GPU compositor layer (hardware-accelerated).
 * 3. backface-visibility: hidden — eliminates sub-pixel rendering artifacts.
 * 4. will-change — hints browser to optimize this element.
 * 5. 1.1s duration with a soft spring-like easing for a luxurious feel.
 */
export function useScrollReveal({
  threshold = 0.08,
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
          // Double rAF: first frame = browser paints opacity:0,
          // second frame = browser is ready, THEN we trigger the transition.
          // This is the #1 trick for jank-free reveal animations.
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (delay > 0) {
                setTimeout(() => setRevealed(true), delay)
              } else {
                setRevealed(true)
              }
            })
          })
          if (once) observer.unobserve(el)
        } else if (!entry.isIntersecting && !once) {
          revealedRef.current = false
          setRevealed(false)
        }
      },
      { threshold, rootMargin: '0px 0px -20px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, delay, once])

  const style: CSSProperties = {
    opacity: revealed ? 1 : 0,
    transform: revealed
      ? 'translate3d(0, 0, 0)'
      : 'translate3d(0, 16px, 0)',
    transition: [
      'opacity 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
      'transform 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
    ].join(', '),
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  }

  return { ref, style }
}
