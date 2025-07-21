"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedProgressProps {
  value: number
  max?: number
  className?: string
  indicatorClassName?: string
  delay?: number
  duration?: number
  showValue?: boolean
  valuePrefix?: string
  valueSuffix?: string
}

export function AnimatedProgress({
  value,
  max = 100,
  className,
  indicatorClassName,
  delay = 0,
  duration = 1,
  showValue = false,
  valuePrefix = "",
  valueSuffix = "",
}: AnimatedProgressProps) {
  const progressRef = useRef<HTMLDivElement>(null)
  const inView = useInView(progressRef, { once: true, amount: 0.5 })
  const [hasAnimated, setHasAnimated] = useState(false)
  const [displayValue, setDisplayValue] = useState(0)

  // Calculate percentage
  const percentage = (value / max) * 100

  useEffect(() => {
    if (inView && !hasAnimated) {
      setHasAnimated(true)

      // Animate the display value if showValue is true
      if (showValue) {
        let startTime: number
        let animationFrame: number

        const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp
          const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
          setDisplayValue(Math.round(progress * value))

          if (progress < 1) {
            animationFrame = requestAnimationFrame(animate)
          }
        }

        setTimeout(() => {
          animationFrame = requestAnimationFrame(animate)
        }, delay * 1000)

        return () => {
          if (animationFrame) cancelAnimationFrame(animationFrame)
        }
      }
    }
  }, [inView, hasAnimated, value, duration, delay, showValue])

  return (
    <div ref={progressRef} className="relative">
      {showValue && (
        <div className="flex justify-between mb-1 text-sm">
          <span>
            {valuePrefix}
            {displayValue}
            {valueSuffix}
          </span>
          <span>
            {valuePrefix}
            {max}
            {valueSuffix}
          </span>
        </div>
      )}
      <div className={cn("h-2 w-full bg-zinc-800 rounded-full overflow-hidden", className)}>
        <motion.div
          className={cn("h-full bg-gradient-to-r from-primary-600 to-secondary-600", indicatorClassName)}
          initial={{ width: 0 }}
          animate={inView ? { width: `${percentage}%` } : {}}
          transition={{ duration, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

