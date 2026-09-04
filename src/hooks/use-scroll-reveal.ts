'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'

interface UseScrollRevealOptions {
  /** Percentage of element visible before triggering (0–1) */
  threshold?: number
  /** Distance in px the element travels during reveal */
  offset?: number
  /** Delay in ms before animation starts */
  delay?: number
  /** Only trigger once */
  once?: boolean
}

interface ScrollRevealState {
  ref: RefObject<HTMLDivElement | null>
  isVisible: boolean
  style: React.CSSProperties
}

/**
 * Lightweight hook that uses IntersectionObserver to detect when an element
 * enters the viewport and applies a smooth reveal animation via inline styles.
 *
 * Returns a ref and computed visibility + style props.
 */
export function useScrollReveal({
  threshold = 0.15,
  offset = 40,
  delay = 0,
  once = true,
}: UseScrollRevealOptions = {}): ScrollRevealState {
  const ref = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) observer.unobserve(el)
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin: '0px 0px -60px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, once])

  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : `translateY(${offset}px)`,
    transition: `opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
  }

  return { ref, isVisible, style }
}
