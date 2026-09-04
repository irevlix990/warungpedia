'use client'

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface ScrollRevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

/**
 * Scroll-reveal wrapper powered by Framer Motion.
 * Uses spring physics for ultra-smooth scale + fade animation.
 * GPU-accelerated by default.
 */
export function ScrollReveal({
  children,
  delay = 0,
  className = '',
}: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
        delay: delay / 1000,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
