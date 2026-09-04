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
 * Ultra-smooth scroll reveal using IntersectionObserver.
 * Very subtle movement (≤20px) with generous duration (0.85s)
 * and a soft expo-out easing curve for a fluid, buttery feel.
 */
export function useScrollReveal({
  threshold = 0.1,
  offset = 18,
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
      { threshold, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, once])

  // Ultra-smooth: subtle slide + fade with a soft expo-out curve
  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0) scale(1)' : `translateY(${offset}px) scale(0.985)`,
    transition: [
      `opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      `transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    ].join(', '),
  }

  return { ref, isVisible, style }
}
