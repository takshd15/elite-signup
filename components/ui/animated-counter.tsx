"use client"
import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, useInView, useMotionValue, useSpring } from "framer-motion"

interface AnimatedCounterProps {
  from: number
  to: number
  duration?: number
  delay?: number
  formatter?: (value: number) => string
  className?: string
}

export function AnimatedCounter({
  from,
  to,
  duration = 1,
  delay = 0,
  formatter = (value) => Math.round(value).toString(),
  className,
}: AnimatedCounterProps) {
  const nodeRef = useRef<HTMLSpanElement>(null)
  const inView = useInView(nodeRef, { once: true, amount: 0.5 })
  const [hasAnimated, setHasAnimated] = useState(false)

  // Use motion value for smooth animation
  const count = useMotionValue(from)
  const smoothCount = useSpring(count, { duration: duration * 1000, bounce: 0 })

  useEffect(() => {
    if (inView && !hasAnimated) {
      setTimeout(() => {
        count.set(to)
        setHasAnimated(true)
      }, delay * 1000)
    }
  }, [inView, count, to, delay, hasAnimated])

  const [displayValue, setDisplayValue] = useState(formatter(from))

  useEffect(() => {
    const unsubscribe = smoothCount.onChange((value) => {
      setDisplayValue(formatter(value))
    })
    return unsubscribe
  }, [smoothCount, formatter])

  return (
    <motion.span
      ref={nodeRef}
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      {displayValue}
    </motion.span>
  )
}

