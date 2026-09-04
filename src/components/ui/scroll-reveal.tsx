'use client'

import { type ReactNode } from 'react'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

interface ScrollRevealProps {
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  delay?: number
  className?: string
}

/**
 * Wrapper that reveals its children with a smooth inline-style transition
 * when they enter the viewport. Uses requestAnimationFrame to ensure
 * the browser paints the hidden state before triggering the transition.
 */
export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  className = '',
}: ScrollRevealProps) {
  const { ref, style } = useScrollReveal({ delay, once: true })

  // Direction is kept for API compatibility but all use translateY for now
  // (the most natural scroll direction). Can be extended if needed.
  void direction

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  )
}
