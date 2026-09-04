'use client'

import { type ReactNode } from 'react'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

interface ScrollRevealProps {
  children: ReactNode
  /** Animation direction */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  /** Delay in ms */
  delay?: number
  /** Additional CSS classes */
  className?: string
}

const OFFSET_MAP = {
  up: 18,
  down: -18,
  left: 18,
  right: -18,
  none: 0,
}

/**
 * Wrapper component that reveals its children with a smooth animation
 * when they enter the viewport.
 *
 * Usage:
 *   <ScrollReveal direction="up" delay={100}>
 *     <SectionTitle ... />
 *   </ScrollReveal>
 */
export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  className = '',
}: ScrollRevealProps) {
  const { ref, style } = useScrollReveal({
    offset: OFFSET_MAP[direction],
    delay,
    once: true,
  })

  return (
    <div
      ref={ref}
      style={style}
      className={`will-change-transform ${className}`}
    >
      {children}
    </div>
  )
}
