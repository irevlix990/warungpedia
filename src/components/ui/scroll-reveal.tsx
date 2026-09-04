'use client'

import { type ReactNode } from 'react'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { cn } from '@/utils/cn'

interface ScrollRevealProps {
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  delay?: number
  className?: string
}

/**
 * Wrapper that reveals its children with a GPU-composited CSS @keyframes
 * animation when they enter the viewport. Zero React re-renders for animation.
 *
 * The element starts with `opacity: 0` via `.wp-reveal` class.
 * When in viewport, `.is-revealed` is toggled, triggering the CSS animation.
 */
export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  className = '',
}: ScrollRevealProps) {
  const { ref } = useScrollReveal({ delay, once: true })

  return (
    <div
      ref={ref}
      className={cn('wp-reveal', `wp-reveal-${direction}`, className)}
      style={delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
