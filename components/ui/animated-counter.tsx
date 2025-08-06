"use client"

import { useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'

interface AnimatedCounterProps {
  from: number
  to: number
  duration?: number
  delay?: number
  className?: string
}

export default function AnimatedCounter({ from, to, duration = 2, delay = 0, className }: AnimatedCounterProps) {
  const nodeRef = useRef<HTMLSpanElement>(null)
  const inView = useInView(nodeRef, { once: true })

  useEffect(() => {
    const node = nodeRef.current
    if (!node || !inView) return

    const startTime = performance.now()
    const range = to - from

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const current = Math.floor(from + range * easeOutQuart)

      node.textContent = current.toLocaleString()

      if (progress < 1) {
        requestAnimationFrame(updateCount)
      } else {
        node.textContent = to.toLocaleString()
      }
    }

    setTimeout(() => {
      requestAnimationFrame(updateCount)
    }, delay * 1000)
  }, [from, to, duration, delay, inView])

  return <span ref={nodeRef} className={className}>{from.toLocaleString()}</span>
}